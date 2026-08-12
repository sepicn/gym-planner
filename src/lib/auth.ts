import { createAuthClient } from "@neondatabase/neon-js/auth"

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL)

// Neon injects the project JWT into session.token from the set-auth-jwt
// response header; this mirrors the SDK's own getJWTToken().
export async function getAuthToken(): Promise<string | null> {
  const session = await authClient.getSession()
  return session.data?.session?.token ?? null
}
