import { lazy, Suspense, type ReactNode } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Navbar from "./components/layout/Navbar"
import ProtectedRoute from "./components/layout/ProtectedRoute"
import AuthProvider from "./context/AuthContext"
import ToastProvider from "./context/ToastProvider"
import { useAuth } from "./context/auth-context"

// Home ships in the entry chunk because signed-out visitors land there.
const Onboarding = lazy(() => import("./pages/Onboarding"))
const Profile = lazy(() => import("./pages/Profile"))
const Account = lazy(() => import("./pages/Account"))
const Auth = lazy(() => import("./pages/Auth"))
const NotFound = lazy(() => import("./pages/NotFound"))
const AuthUIProvider = lazy(
  () => import("./components/layout/AuthUIProvider"),
)

// Only UserButton, AuthView and AccountView need the Neon auth UI. Mounting it
// on demand keeps its chunk off the landing page a signed-out visitor sees.
function AuthUIBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const needsAuthUI =
    Boolean(user) ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/account")

  if (!needsAuthUI) {
    return children
  }

  return (
    <Suspense fallback={null}>
      <AuthUIProvider>{children}</AuthUIProvider>
    </Suspense>
  )
}

function Shell() {
  return (
    <AuthUIBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={null}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="/auth/:pathname" element={<Auth />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/:pathname"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </AuthUIBoundary>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
