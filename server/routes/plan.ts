import { Router, type Request, type Response } from "express"
import rateLimit from "express-rate-limit"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { generateTrainingPlan } from "../src/lib/ai"
import { getUserId, requireAuth } from "../middleware/requireAuth"
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
  keyGenerator: (req: Request) => getUserId(req),
  message: { error: "Too many plan generations. Try again later." },
})

planRouter.post(
  "/generate",
  generateLimiter,
  async (req: Request, res: Response) => {
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: getUserId(req) },
    })

    if (!profile) {
      throw new HttpError(
        400,
        "User profile not found. Complete onboarding first.",
      )
    }

    const latestPlan = await prisma.training_plans.findFirst({
      where: { user_id: getUserId(req) },
      orderBy: { created_at: "desc" },
      select: { version: true },
    })

    const planJson = await generateTrainingPlan(profile)

    const newPlan = await prisma.training_plans.create({
      data: {
        user_id: getUserId(req),
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
    where: { user_id: getUserId(req) },
    orderBy: { created_at: "desc" },
  })

  if (!plan) {
    throw new HttpError(404, "No plan found")
  }

  res.json(serializePlan(plan))
})

planRouter.get("/history", async (req: Request, res: Response) => {
  const plans = await prisma.training_plans.findMany({
    where: { user_id: getUserId(req) },
    orderBy: { created_at: "desc" },
    select: { id: true, version: true, created_at: true },
  })

  res.json(
    plans.map((plan) => ({
      id: plan.id,
      version: plan.version,
      createdAt: plan.created_at,
    })),
  )
})

// Registered after the fixed paths above so it cannot swallow them.
planRouter.get("/:id", async (req: Request, res: Response) => {
  const id = z.uuid().safeParse(req.params.id)

  if (!id.success) {
    throw new HttpError(404, "No plan found")
  }

  // Scoped to the token's user, so an id from another account is a 404.
  const plan = await prisma.training_plans.findFirst({
    where: { id: id.data, user_id: getUserId(req) },
  })

  if (!plan) {
    throw new HttpError(404, "No plan found")
  }

  res.json(serializePlan(plan))
})

// plan_text duplicates plan_json, so it stays in the row but off the wire.
function serializePlan(plan: {
  id: string
  user_id: string
  plan_json: unknown
  version: number
  created_at: Date
}) {
  return {
    id: plan.id,
    userId: plan.user_id,
    planJson: plan.plan_json,
    version: plan.version,
    createdAt: plan.created_at,
  }
}
