import { Router, type Request, type Response } from "express"
import { prisma } from "../lib/prisma"
import { getUserId, requireAuth } from "../middleware/requireAuth"
import { HttpError } from "../lib/HttpError"
import { profileInputSchema } from "../schemas/profile"

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.get("/", async (req: Request, res: Response) => {
  const profile = await prisma.user_profiles.findUnique({
    where: { user_id: getUserId(req) },
  })

  if (!profile) {
    throw new HttpError(404, "No profile found")
  }

  res.json({
    userId: profile.user_id,
    goal: profile.goal,
    experience: profile.experience,
    daysPerWeek: profile.days_per_week,
    sessionLength: profile.session_length,
    equipment: profile.equipment,
    injuries: profile.injuries,
    preferredSplit: profile.preferred_split,
    updatedAt: profile.updated_at,
  })
})

profileRouter.post("/", async (req: Request, res: Response) => {
  const profile = profileInputSchema.parse(req.body)
  const injuries = profile.injuries?.trim() || null

  await prisma.user_profiles.upsert({
    where: { user_id: getUserId(req) },
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
      user_id: getUserId(req),
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
