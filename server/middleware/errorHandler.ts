import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { HttpError } from "../lib/HttpError"

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" })
}

// Express 5 forwards rejected async handlers here, so every failure leaves as
// JSON the client can parse instead of an HTML stack trace.
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(error)

  if (error instanceof HttpError) {
    return res
      .status(error.status)
      .json({ error: error.message, details: error.details })
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request body",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    })
  }

  console.error("Unhandled server error:", error)
  res.status(500).json({ error: "Something went wrong" })
}
