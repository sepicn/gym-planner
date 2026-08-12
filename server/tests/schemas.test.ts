import { describe, expect, it } from "vitest"
import { profileInputSchema } from "../schemas/profile"
import { trainingPlanSchema } from "../schemas/plan"

const validProfile = {
  goal: "bulk",
  experience: "beginner",
  daysPerWeek: 3,
  sessionLength: 60,
  equipment: "home",
  preferredSplit: "ppl",
}

describe("profileInputSchema", () => {
  it("accepts a well formed profile", () => {
    expect(profileInputSchema.safeParse(validProfile).success).toBe(true)
  })

  it.each([
    ["goal", "yolo"],
    ["experience", "wizard"],
    ["equipment", "spaceship"],
    ["preferredSplit", "vibes"],
  ])("rejects an unknown %s", (field, value) => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      [field]: value,
    })
    expect(result.success).toBe(false)
  })

  it.each([0, -1, 8, 99])("rejects daysPerWeek of %i", (daysPerWeek) => {
    expect(
      profileInputSchema.safeParse({ ...validProfile, daysPerWeek }).success,
    ).toBe(false)
  })

  it.each([10, 240])("rejects sessionLength of %i", (sessionLength) => {
    expect(
      profileInputSchema.safeParse({ ...validProfile, sessionLength }).success,
    ).toBe(false)
  })

  it("coerces numeric strings coming from form selects", () => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      daysPerWeek: "4",
      sessionLength: "90",
    })

    expect(result.success).toBe(true)
    expect(result.data?.daysPerWeek).toBe(4)
    expect(result.data?.sessionLength).toBe(90)
  })

  it("rejects an oversized injuries field", () => {
    expect(
      profileInputSchema.safeParse({
        ...validProfile,
        injuries: "x".repeat(501),
      }).success,
    ).toBe(false)
  })

  it("allows injuries to be omitted or null", () => {
    expect(profileInputSchema.safeParse(validProfile).success).toBe(true)
    expect(
      profileInputSchema.safeParse({ ...validProfile, injuries: null }).success,
    ).toBe(true)
  })

  it("drops unknown fields instead of persisting them", () => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      userId: "someone-elses-id",
    })

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty("userId")
  })
})

const validPlan = {
  overview: { goal: "g", frequency: "3 days", split: "ppl", notes: "n" },
  weeklySchedule: [
    {
      day: "Monday",
      focus: "Push",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", rest: "2 min", rpe: 8 },
      ],
    },
  ],
  progression: "Add weight when all sets are clean.",
}

describe("trainingPlanSchema", () => {
  it("accepts a well formed plan", () => {
    expect(trainingPlanSchema.safeParse(validPlan).success).toBe(true)
  })

  it("rejects a plan with no workout days", () => {
    expect(
      trainingPlanSchema.safeParse({ ...validPlan, weeklySchedule: [] })
        .success,
    ).toBe(false)
  })

  it("rejects a day with no exercises", () => {
    expect(
      trainingPlanSchema.safeParse({
        ...validPlan,
        weeklySchedule: [{ day: "Monday", focus: "Push", exercises: [] }],
      }).success,
    ).toBe(false)
  })

  it.each([0, 11, 42])("rejects an rpe of %i", (rpe) => {
    expect(
      trainingPlanSchema.safeParse({
        ...validPlan,
        weeklySchedule: [
          {
            day: "Monday",
            focus: "Push",
            exercises: [
              { name: "Bench", sets: 4, reps: "6", rest: "2 min", rpe },
            ],
          },
        ],
      }).success,
    ).toBe(false)
  })

  it("coerces a numeric reps value into a string", () => {
    const result = trainingPlanSchema.safeParse({
      ...validPlan,
      weeklySchedule: [
        {
          day: "Monday",
          focus: "Push",
          exercises: [
            { name: "Bench", sets: 4, reps: 8, rest: "2 min", rpe: 8 },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.data?.weeklySchedule[0].exercises[0].reps).toBe("8")
  })

  it("rejects an exercise with a blank name", () => {
    expect(
      trainingPlanSchema.safeParse({
        ...validPlan,
        weeklySchedule: [
          {
            day: "Monday",
            focus: "Push",
            exercises: [
              { name: "   ", sets: 4, reps: "6", rest: "2 min", rpe: 8 },
            ],
          },
        ],
      }).success,
    ).toBe(false)
  })

  it("keeps optional notes and alternatives when present", () => {
    const result = trainingPlanSchema.safeParse({
      ...validPlan,
      weeklySchedule: [
        {
          day: "Monday",
          focus: "Push",
          exercises: [
            {
              name: "Bench",
              sets: 4,
              reps: "6",
              rest: "2 min",
              rpe: 8,
              notes: "Elbows tucked",
              alternatives: ["Dumbbell Press", "Floor Press"],
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.data?.weeklySchedule[0].exercises[0].alternatives).toEqual([
      "Dumbbell Press",
      "Floor Press",
    ])
  })
})
