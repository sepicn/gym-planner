import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { env } from "../lib/env"
import { profileRouter } from "../routes/profile"
import { planRouter } from "../routes/plan"
import { errorHandler, notFoundHandler } from "../middleware/errorHandler"

const app = express()

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: "100kb" }))

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/profile", profileRouter)
app.use("/api/plan", planRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server running on port: ${env.PORT}`)
})
