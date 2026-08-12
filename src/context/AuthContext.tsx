import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useStore } from "@neondatabase/neon-js/auth/react"
import type { TrainingPlan, User, UserProfile } from "../types"
import { authClient } from "../lib/auth"
import { api, ApiError, type PlanSummary } from "../lib/api"
import { AuthContext } from "./auth-context"

interface UserDataState {
  userId: string
  plan: TrainingPlan | null
  profile: UserProfile | null
  planHistory: PlanSummary[]
  error: string | null
}

// A 404 is a valid answer here: the user simply has no plan or profile yet.
async function orNullOn404<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const session = useStore(authClient.useSession)
  const user = (session.data?.user as User | undefined) ?? null
  const userId = user?.id ?? null

  // Keyed to its owner so the previous account's data can never surface while
  // the next fetch is in flight.
  const [data, setData] = useState<UserDataState | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const requestIdRef = useRef(0)

  const refreshData = useCallback(async () => {
    if (!userId) return

    // Last request wins; earlier responses are dropped.
    const requestId = ++requestIdRef.current

    try {
      const [plan, profile, planHistory] = await Promise.all([
        orNullOn404(api.getCurrentPlan()),
        orNullOn404(api.getProfile()),
        api.getPlanHistory(),
      ])
      if (requestId !== requestIdRef.current) return

      setData({ userId, error: null, plan, profile, planHistory })
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      console.error("Error loading user data:", error)
      setData({
        userId,
        plan: null,
        profile: null,
        planHistory: [],
        error:
          error instanceof Error ? error.message : "Could not load your data.",
      })
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // setState runs after the await, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshData()
  }, [userId, refreshData])

  const resolved = userId && data?.userId === userId ? data : null
  const isSessionLoading = session.isPending
  const isLoading = isSessionLoading || (userId !== null && resolved === null)
  const plan = userId === null ? null : resolved ? resolved.plan : undefined
  const profile = userId === null ? null : resolved ? resolved.profile : undefined
  const planHistory = resolved?.planHistory ?? []
  const planError = resolved?.error ?? null

  async function saveProfile(
    profileData: Omit<UserProfile, "userId" | "updatedAt">,
  ) {
    if (!userId) {
      throw new Error("User must be authenticated to save profile")
    }

    await api.saveProfile(profileData)
    await refreshData()
  }

  async function generatePlan() {
    if (!userId) {
      throw new Error("User must be authenticated to generate plan")
    }

    setIsGeneratingPlan(true)
    try {
      await api.generatePlan()
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
        profile,
        planHistory,
        planError,
        isSessionLoading,
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
