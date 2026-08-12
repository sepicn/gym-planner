import { z } from "zod"

export const profileInputSchema = z.object({
  goal: z.enum(["cut", "bulk", "recomp", "strength", "endurance"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  sessionLength: z.coerce.number().int().min(15).max(180),
  equipment: z.enum(["full_gym", "home", "dumbbells"]),
  injuries: z.string().trim().max(500).optional().nullable(),
  preferredSplit: z.enum(["full_body", "upper_lower", "ppl", "custom"]),
})

export type ProfileInput = z.infer<typeof profileInputSchema>
