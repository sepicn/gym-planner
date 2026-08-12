import { Router, type Request, type Response } from "express"
import rateLimit from "express-rate-limit"
import { prisma } from "../lib/prisma"
import { generateTrainingPlan } from "../src/lib/ai"
import { requireAuth } from "../middleware/requireAuth"
import { HttpError } from "../lib/HttpError"

export const planRouter = Router()

planRouter.use(requireAuth)

// Every generate call costs an AI request, so budget it per user rather than
// per IP - several users can share one NAT.
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.userId,
  message: { error: "Too many plan generations. Try again later." },
})

planRouter.post(
  "/generate",
  generateLimiter,
  async (req: Request, res: Response) => {
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: req.userId },
    })

    if (!profile) {
      throw new HttpError(
        400,
        "User profile not found. Complete onboarding first.",
      )
    }

    const latestPlan = await prisma.training_plans.findFirst({
      where: { user_id: req.userId },
      orderBy: { created_at: "desc" },
      select: { version: true },
    })

    const planJson = await generateTrainingPlan(profile)

    const newPlan = await prisma.training_plans.create({
      data: {
        user_id: req.userId,
        plan_json: planJson,
        plan_text: JSON.stringify(planJson, null, 2),
        version: latestPlan ? latestPlan.version + 1 : 1,
      },
    })

    res.json({
      id: newPlan.id,
      version: newPlan.version,
      createdAt: newPlan.created_at,
    })
  },
)

planRouter.get("/current", async (req: Request, res: Response) => {
  const plan = await prisma.training_plans.findFirst({
    where: { user_id: req.userId },
    orderBy: { created_at: "desc" },
  })

  if (!plan) {
    throw new HttpError(404, "No plan found")
  }

  res.json({
    id: plan.id,
    userId: plan.user_id,
    planJson: plan.plan_json,
    planText: plan.plan_text,
    version: plan.version,
    createdAt: plan.created_at,
  })
})
