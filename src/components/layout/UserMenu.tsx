import { UserButton } from "@neondatabase/neon-js/auth/react"

// Isolated so the auth UI package stays in the lazy chunk that
// AuthUIProvider already pulls in for signed-in users.
export default function UserMenu() {
  return (
    <UserButton
      // Without an explicit size the trigger renders as a wide name + email
      // pill, which is too heavy for the navbar. It also silences the
      // library's deprecation warning about the changed default.
      size="icon"
      classNames={{
        trigger: {
          base: "ml-1 rounded-full ring-1 ring-border hover:ring-accent/60 transition-colors",
        },
        content: {
          base: "bg-card border border-border rounded-xl",
          separator: "bg-border",
        },
      }}
    />
  )
}
