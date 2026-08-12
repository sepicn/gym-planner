import type { DaySchedule, PlanOverview, UserProfile } from "../types"
import { getAuthToken } from "./auth"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export interface CurrentPlanResponse {
  id: string
  userId: string
  planJson: {
    overview: PlanOverview
    weeklySchedule: DaySchedule[]
    progression: string
  }
  planText: string
  version: number
  createdAt: string
}

// The server derives the user from this token, so no route takes a user id.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()

  if (!token) {
    throw new ApiError("Your session has expired. Please sign in again.", 401)
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.error || "Request failed", res.status)
  }

  return res.json()
}

export const api = {
  saveProfile: (profile: Omit<UserProfile, "userId" | "updatedAt">) =>
    request<{ success: true }>("/profile", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  generatePlan: () =>
    request<{ id: string; version: number; createdAt: string }>(
      "/plan/generate",
      { method: "POST" },
    ),

  getCurrentPlan: () => request<CurrentPlanResponse>("/plan/current"),
}
