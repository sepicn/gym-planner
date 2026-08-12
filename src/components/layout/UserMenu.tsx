import { UserButton } from "@neondatabase/neon-js/auth/react"

// Isolated so the auth UI package stays in the lazy chunk that
// AuthUIProvider already pulls in for signed-in users.
export default function UserMenu() {
  return <UserButton />
}
