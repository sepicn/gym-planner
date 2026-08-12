import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
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
  const [neonUser, setNeonUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isRefreshingRef = useRef(false)
  // undefined = jos ne znamo (fetch nije uspeo), null = server potvrdio da plana nema
  const [plan, setPlan] = useState<TrainingPlan | null | undefined>(undefined)

  useEffect(() => {
    async function loadUser() {
      try {
        const result = await authClient.getSession()
        if (result && result.data?.user) {
          setNeonUser(result.data.user)
        } else {
          setNeonUser(null)
          setIsLoading(false)
        }
      } catch (err) {
        setNeonUser(null)
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  // refreshData memoize

  const refreshData = useCallback(async () => {
    if (!neonUser || isRefreshingRef.current) return

    isRefreshingRef.current = true

    try {
      // const profileData =

      const planData = await api.getCurrentPlan(neonUser.id)

      setPlan({
        id: planData.id,
        userId: planData.userId,
        overview: planData.planJson.overview,
        weeklySchedule: planData.planJson.weeklySchedule,
        progression: planData.planJson.progression,
        version: planData.version,
        createdAt: planData.createdAt,
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      // samo 404 znaci "nema plana"; kod ostalih gresaka ostaje undefined
      setPlan(
        (error as { status?: number }).status === 404 ? null : undefined,
      )
    } finally {
      isRefreshingRef.current = false
    }
  }, [neonUser?.id])

  useEffect(() => {
    if (!neonUser?.id) {
      setPlan(null)
      return
    }
    refreshData().finally(() => setIsLoading(false))
  }, [neonUser?.id, refreshData])

  async function saveProfile(
    profileData: Omit<UserProfile, "userId" | "updatedAt">,
  ) {
    if (!neonUser) {
      throw new Error("User must be authenticated to save profile")
    }

    await api.saveProfile(neonUser.id, profileData)
    await refreshData()
  }

  async function generatePlan() {
    if (!neonUser) {
      throw new Error("User must be authenticated to generate plan")
    }

    await api.generatePlan(neonUser.id)
    await refreshData()
  }

  return (
    <AuthContext.Provider
      value={{
        user: neonUser,
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
