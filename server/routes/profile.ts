import { Router, type Request, type Response } from "express"
import { prisma } from "../lib/prisma"
import { requireAuth } from "../middleware/requireAuth"
import { profileInputSchema } from "../schemas/profile"

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.post("/", async (req: Request, res: Response) => {
  const profile = profileInputSchema.parse(req.body)
  const injuries = profile.injuries?.trim() || null

  await prisma.user_profiles.upsert({
    where: { user_id: req.userId },
    update: {
      goal: profile.goal,
      experience: profile.experience,
      days_per_week: profile.daysPerWeek,
      session_length: profile.sessionLength,
      equipment: profile.equipment,
      injuries,
      preferred_split: profile.preferredSplit,
      updated_at: new Date(),
    },
    create: {
      user_id: req.userId,
      goal: profile.goal,
      experience: profile.experience,
      days_per_week: profile.daysPerWeek,
      session_length: profile.sessionLength,
      equipment: profile.equipment,
      injuries,
      preferred_split: profile.preferredSplit,
    },
  })

  res.json({ success: true })
})
