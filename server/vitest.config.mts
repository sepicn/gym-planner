import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Set before any module imports lib/env, which validates and would
    // otherwise exit the process. dotenv does not override these.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      OPEN_ROUTER_KEY: "test-key",
      NEON_AUTH_URL: "https://auth.test.invalid/neondb/auth",
      BASE_URL: "http://localhost:3001",
    },
  },
})
