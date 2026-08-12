import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Onboarding from "./pages/Onboarding"
import Profile from "./pages/Profile"
import Account from "./pages/Account"
import Auth from "./pages/Auth"
import NotFound from "./pages/NotFound"
import Navbar from "./components/layout/Navbar"
import ProtectedRoute from "./components/layout/ProtectedRoute"
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react"
import { authClient } from "./lib/auth"
import AuthProvider from "./context/AuthContext"
import ToastProvider from "./context/ToastProvider"

export default function App() {
  return (
    <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
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
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </NeonAuthUIProvider>
  )
}
