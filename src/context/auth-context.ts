import { createContext, useContext } from "react"
import type { TrainingPlan, User, UserProfile } from "../types"

export interface AuthUIContextType {
  user: User | null
  // undefined until the plan is resolved; null once the server confirms none
  plan: TrainingPlan | null | undefined
  planError: string | null
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
