import OpenAi from "openai"
import type { UserProfile } from "../../types"
import { env } from "../../lib/env"
import { HttpError } from "../../lib/HttpError"
import { parseModelJson } from "../../lib/parseModelJson"
import { trainingPlanSchema, type ValidatedTrainingPlan } from "../../schemas/plan"

const REQUEST_TIMEOUT_MS = 90_000
const ATTEMPTS_PER_MODEL = 2

const openai = new OpenAi({
  apiKey: env.OPEN_ROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: 0,
  defaultHeaders: {
    "HTTP-Referer": env.BASE_URL,
    "X-Title": "GymAI Plan Generator",
  },
})

export async function generateTrainingPlan(
  profile: UserProfile,
): Promise<ValidatedTrainingPlan> {
  const normalizedProfile = normalizeProfile(profile)
  const prompt = buildPrompt(normalizedProfile)
  const failures: string[] = []

  // Structurally valid but with the wrong number of days - better than nothing
  // if every attempt at an exact match fails.
  let closestPlan: ValidatedTrainingPlan | null = null

  for (const model of env.AI_MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const content = await requestCompletion(model, prompt)
        const plan = trainingPlanSchema.parse(
          applyDefaults(parseModelJson(content), normalizedProfile),
        )

        if (plan.weeklySchedule.length === normalizedProfile.days_per_week) {
          return plan
        }

        closestPlan ??= plan
        throw new Error(
          `expected ${normalizedProfile.days_per_week} workout days, got ${plan.weeklySchedule.length}`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push(`${model} (attempt ${attempt}): ${message}`)
        console.warn(`[AI] ${model} attempt ${attempt} failed: ${message}`)

        if (attempt < ATTEMPTS_PER_MODEL) {
          await sleep(500 * 2 ** (attempt - 1))
        }
      }
    }
  }

  if (closestPlan) {
    console.warn("[AI] Falling back to a plan with a mismatched day count")
    return closestPlan
  }

  throw new HttpError(
    502,
    "The AI could not produce a valid plan. Please try again.",
    failures,
  )
}

async function requestCompletion(model: string, prompt: string) {
  // `reasoning` is an OpenRouter extension, not part of the OpenAI SDK types.
  const params: OpenAi.Chat.ChatCompletionCreateParamsNonStreaming & {
    reasoning?: { enabled: boolean }
  } = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert fitness trainer and program designer. You must respond with valid JSON only. Do not include any markdown, reasoning, or additional text.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    // Reasoning models write the plan into the `reasoning` field and leave
    // `content` as an empty skeleton, so keep thinking off.
    reasoning: { enabled: false },
  }

  const completion = await openai.chat.completions.create(params)
  const content = completion.choices[0]?.message?.content

  if (!content?.trim()) {
    throw new Error("model returned empty content")
  }

  return content
}

function normalizeProfile(profile: UserProfile) {
  return {
    goal: profile.goal || "bulk",
    experience: profile.experience || "intermediate",
    days_per_week: profile.days_per_week || 4,
    session_length: profile.session_length || 60,
    equipment: profile.equipment || "full_gym",
    injuries: profile.injuries || null,
    preferred_split: profile.preferred_split || "upper_lower",
  } satisfies UserProfile
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

// Fills the gaps a model leaves so a mostly-good response still validates.
function applyDefaults(aiResponse: unknown, profile: UserProfile) {
  const root = asRecord(aiResponse)
  const overview = asRecord(root.overview)

  return {
    overview: {
      goal: overview.goal || `Customized ${profile.goal} program`,
      frequency:
        overview.frequency || `${profile.days_per_week} days per week`,
      split: overview.split || profile.preferred_split,
      notes:
        overview.notes ||
        "Follow the program consistently for best results.",
    },
    weeklySchedule: asArray(root.weeklySchedule).map((rawDay) => {
      const day = asRecord(rawDay)
      return {
        day: day.day || "Day",
        focus: day.focus || "Full Body",
        exercises: asArray(day.exercises).map((rawExercise) => {
          const exercise = asRecord(rawExercise)
          return {
            name: exercise.name || "Exercise",
            sets: exercise.sets || 3,
            reps: exercise.reps || "8-12",
            rest: exercise.rest || "60-90 sec",
            rpe: exercise.rpe || 7,
            notes: exercise.notes,
            alternatives: exercise.alternatives,
          }
        }),
      }
    }),
    progression:
      root.progression ||
      "Increase weight by 2.5-5lbs when you can complete all sets with good form. Track your progress weekly.",
  }
}

function buildPrompt(userProfile: UserProfile): string {
  const goalMap: Record<string, string> = {
    bulk: "build muscle and gain size",
    cut: "lose fat and maintain muscle",
    recomp: "simultaneously lose fat and build muscle",
    strength: "build maximum strength",
    endurance: "improve cardiovascular endurance and stamina",
  }

  const experienceMap: Record<string, string> = {
    beginner: "beginner (0-1 years of training experience)",
    intermediate: "intermediate (1-3 years of training experience)",
    advanced: "advanced (3+ years of training experience)",
  }

  const equipmentMap: Record<string, string> = {
    full_gym: "full gym access with all equipment",
    home: "home gym with limited equipment",
    dumbbells: "only dumbbells available",
  }

  const splitMap: Record<string, string> = {
    full_body: "full body workouts",
    upper_lower: "upper/lower split",
    ppl: "push/pull/legs split",
    custom: "best split for their goals",
  }

  return `Create a personalized ${userProfile.days_per_week}-day per week training plan for someone with the following userProfile:

    Goal: ${goalMap[userProfile.goal] || userProfile.goal}
    Experience Level: ${experienceMap[userProfile.experience] || userProfile.experience}
    Session Length: ${userProfile.session_length} minutes per session
    Equipment: ${equipmentMap[userProfile.equipment] || userProfile.equipment}
    Preferred Split: ${splitMap[userProfile.preferred_split] || userProfile.preferred_split}
    ${userProfile.injuries ? `Injuries/Limitations: ${userProfile.injuries}` : ""}

    Generate a complete training plan in JSON format with this exact structure:
    {
      "overview": {
        "goal": "brief description of the training goal",
        "frequency": "X days per week",
        "split": "training split name",
        "notes": "important notes about the program (2-3 sentences)"
      },
      "weeklySchedule": [
        {
          "day": "Monday",
          "focus": "muscle group or focus area",
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": 4,
              "reps": "6-8",
              "rest": "2-3 min",
              "rpe": 8,
              "notes": "form cues or tips (optional)",
              "alternatives": ["Alternative 1", "Alternative 2"]
            }
          ]
        }
      ],
      "progression": "detailed progression strategy (2-3 sentences explaining how to progress)"
    }

      Requirements:
      - Create exactly ${userProfile.days_per_week} workout days
      - Each workout should fit within ${userProfile.session_length} minutes
      - Include 4-6 exercises per workout
      - RPE (Rate of Perceived Exertion) should be 6-9
      - Include compound movements for beginners/intermediate, advanced can have more isolation
      - Match the preferred split type: ${userProfile.preferred_split}
      - ${userProfile.injuries ? `Avoid exercises that could aggravate: ${userProfile.injuries}` : ""}
      - Provide exercise alternatives where appropriate
      - Make it progressive and suitable for ${experienceMap[userProfile.experience] || userProfile.experience} level

      Return ONLY the JSON object (no markdown, no extra text).
  `
}
