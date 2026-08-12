import { z } from "zod"

// Gate between the model and the database: whatever reaches training_plans is
// already shaped the way the client expects to render it.
export const exerciseSchema = z.object({
  name: z.string().trim().min(1),
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.coerce.string().min(1),
  rest: z.coerce.string().min(1),
  rpe: z.coerce.number().min(1).max(10),
  notes: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
})

export const dayScheduleSchema = z.object({
  day: z.string().trim().min(1),
  focus: z.string().trim().min(1),
  exercises: z.array(exerciseSchema).min(1),
})

export const trainingPlanSchema = z.object({
  overview: z.object({
    goal: z.string().trim().min(1),
    frequency: z.string().trim().min(1),
    split: z.string().trim().min(1),
    notes: z.string().trim().min(1),
  }),
  weeklySchedule: z.array(dayScheduleSchema).min(1),
  progression: z.string().trim().min(1),
})

export type ValidatedTrainingPlan = z.infer<typeof trainingPlanSchema>
