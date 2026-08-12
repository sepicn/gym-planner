import { Navigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  return <div>Home Page</div>
}
