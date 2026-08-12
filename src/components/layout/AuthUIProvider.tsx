import type { ReactNode } from "react"
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react"
import { authClient } from "../../lib/auth"

// Isolated in its own module so the auth UI package lands in a lazy chunk.
export default function AuthUIProvider({ children }: { children: ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
      {children}
    </NeonAuthUIProvider>
  )
}
