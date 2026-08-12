import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useStore } from "@neondatabase/neon-js/auth/react"
import type { TrainingPlan, User, UserProfile } from "../types"
import { authClient } from "../lib/auth"
import { api } from "../lib/api"
import { AuthContext } from "./auth-context"

interface PlanState {
  userId: string
  plan: TrainingPlan | null
  error: string | null
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const session = useStore(authClient.useSession)
  const user = (session.data?.user as User | undefined) ?? null
  const userId = user?.id ?? null

  // Keyed to its owner so the previous account's plan can never surface while
  // the next fetch is in flight.
  const [planState, setPlanState] = useState<PlanState | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const requestIdRef = useRef(0)

  const refreshData = useCallback(async () => {
    if (!userId) return

    // Last request wins; earlier responses are dropped.
    const requestId = ++requestIdRef.current

    try {
      const planData = await api.getCurrentPlan(userId)
      if (requestId !== requestIdRef.current) return

      setPlanState({
        userId,
        error: null,
        plan: {
          id: planData.id,
          userId: planData.userId,
          overview: planData.planJson.overview,
          weeklySchedule: planData.planJson.weeklySchedule,
          progression: planData.planJson.progression,
          version: planData.version,
          createdAt: planData.createdAt,
        },
      })
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      // Only a 404 proves there is no plan; anything else is a real failure.
      const isMissing = (error as { status?: number }).status === 404
      if (!isMissing) console.error("Error loading plan:", error)

      setPlanState({
        userId,
        plan: null,
        error: isMissing
          ? null
          : error instanceof Error
            ? error.message
            : "Could not load your plan.",
      })
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // setState runs after the await, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshData()
  }, [userId, refreshData])

  const resolved = userId && planState?.userId === userId ? planState : null
  const isLoading = session.isPending || (userId !== null && resolved === null)
  const plan = userId === null ? null : resolved ? resolved.plan : undefined
  const planError = resolved?.error ?? null

  async function saveProfile(
    profileData: Omit<UserProfile, "userId" | "updatedAt">,
  ) {
    if (!userId) {
      throw new Error("User must be authenticated to save profile")
    }

    await api.saveProfile(userId, profileData)
    await refreshData()
  }

  async function generatePlan() {
    if (!userId) {
      throw new Error("User must be authenticated to generate plan")
    }

    setIsGeneratingPlan(true)
    try {
      await api.generatePlan(userId)
      await refreshData()
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        plan,
        planError,
        isLoading,
        isGeneratingPlan,
        saveProfile,
        generatePlan,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
