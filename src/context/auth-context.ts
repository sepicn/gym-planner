import { createContext, useContext } from "react"
import type { TrainingPlan, User, UserProfile } from "../types"
import type { PlanSummary } from "../lib/api"

export interface AuthUIContextType {
  user: User | null
  // undefined until resolved; null once the server confirms there is none
  plan: TrainingPlan | null | undefined
  profile: UserProfile | null | undefined
  // Newest first, including the current plan
  planHistory: PlanSummary[]
  planError: string | null
  // Only the session lookup - use this to decide whether someone is signed in
  isSessionLoading: boolean
  // Session plus the user's data
  isLoading: boolean
  isGeneratingPlan: boolean
  saveProfile: (
    profile: Omit<UserProfile, "userId" | "updatedAt">,
  ) => Promise<void>
  generatePlan: () => Promise<void>
  refreshData: () => Promise<void>
}

export const AuthContext = createContext<AuthUIContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
