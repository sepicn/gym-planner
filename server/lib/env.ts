import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPEN_ROUTER_KEY: z.string().min(1, "OPEN_ROUTER_KEY is required"),
  NEON_AUTH_URL: z.url("NEON_AUTH_URL must be the Neon Auth base URL"),
  // Comma-separated list of browser origins allowed to call this API.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  // Set once you have inspected a real token; tightens verification.
  NEON_AUTH_ISSUER: z.string().optional(),
  BASE_URL: z.url().default("http://localhost:3001"),
  // Tried in order. Free OpenRouter models come and go, so keep this override.
  AI_MODELS: z
    .string()
    .default("nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free")
    .transform((value) =>
      value
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean),
    ),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n")
  console.error(`Invalid server environment:\n${issues}`)
  process.exit(1)
}

export const env = parsed.data
