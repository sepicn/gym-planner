import type { UserProfile } from "../types"
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Request failed")
  }

  return res.json()
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const error = new Error(data.error || "Request failed")
    ;(error as Error & { status?: number }).status = res.status
    throw error
  }

  return res.json()
}

export const api = {
  saveProfile: (
    userId: string,
    profile: Omit<UserProfile, "userId" | "updatedAt">,
  ) => {
    return post<{ success: true }>("/profile", { userId, ...profile })
  },

  generatePlan: (userId: string) => {
    return post("/plan/generate", { userId })
  },

  getCurrentPlan:(userId:string)=>{
    return get(`/plan/current?userId=${userId}`)
  }
}
