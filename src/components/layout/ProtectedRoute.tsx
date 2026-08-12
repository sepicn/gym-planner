import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../../context/auth-context"

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isSessionLoading } = useAuth()

  // Waits on the session only; pages render their own data-loading state.
  if (isSessionLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  return <>{children}</>
}
