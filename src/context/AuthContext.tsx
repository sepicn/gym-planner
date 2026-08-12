import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useStore } from "@neondatabase/neon-js/auth/react"
import type { TrainingPlan, User, UserProfile } from "../types"
import { authClient } from "../lib/auth"
import { api } from "../lib/api"

interface AuthUIContextType {
  user: User | null
  plan: TrainingPlan | null | undefined
  isLoading: boolean
  saveProfile: (
    profile: Omit<UserProfile, "userId" | "updatedAt">,
  ) => Promise<void>
  generatePlan: () => Promise<void>
  refreshData: () => Promise<void>
}

const AuthContext = createContext<AuthUIContextType | null>(null)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const session = useStore(authClient.useSession)
  const user = (session.data?.user as User | undefined) ?? null
  const userId = user?.id ?? null

  // Keyed to its owner so the previous account's plan can never surface while
  // the next fetch is in flight. plan: undefined = failed, null = no plan.
  const [planState, setPlanState] = useState<{
    userId: string
    plan: TrainingPlan | null | undefined
  } | null>(null)
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

      console.error("Error refreshing data:", error)
      // Only a 404 proves there is no plan; other failures stay unresolved.
      setPlanState({
        userId,
        plan: (error as { status?: number }).status === 404 ? null : undefined,
      })
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // setState runs after the await, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshData()
  }, [userId, refreshData])

  const isResolved = userId === null || planState?.userId === userId
  const plan = userId === null ? null : isResolved ? planState?.plan : undefined
  const isLoading = session.isPending || !isResolved

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

    await api.generatePlan(userId)
    await refreshData()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        plan,
        isLoading,
        saveProfile,
        generatePlan,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
