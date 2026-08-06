import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Onboarding from "./pages/Onboarding"
import Profile from "./pages/Profile"
import Account from "./pages/Account"
import Auth from "./pages/Auth"
import Navbar from "./components/layout/Navbar"
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react"
import { authClient } from "./lib/auth"
import AuthProvider from "./context/AuthContext"

export default function App() {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route index element={<Home />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth/:pathname" element={<Auth />} />
                <Route path="/account/:pathname" element={<Account />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </NeonAuthUIProvider>
  )
}
