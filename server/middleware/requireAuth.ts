import type { NextFunction, Request, Response } from "express"
import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from "jose"
import { env } from "../lib/env"
import { HttpError } from "../lib/HttpError"

// Neon Auth serves one key set per project, so a valid signature already proves
// the token was minted for this project. Keys are cached and rotated by jose.
const jwks = createRemoteJWKSet(
  new URL(`${env.NEON_AUTH_URL.replace(/\/$/, "")}/.well-known/jwks.json`),
)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // Optional on purpose: only requireAuth sets it. Read it through
      // getUserId so a route mounted without the middleware fails loudly
      // instead of passing undefined into Prisma, where an undefined filter
      // is silently dropped and would match another user's rows.
      userId?: string
    }
  }
}

export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new HttpError(401, "Not authenticated")
  }
  return req.userId
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return null

  const token = header.slice("Bearer ".length).trim()
  return token.length > 0 ? token : null
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = readBearerToken(req)

  if (!token) {
    return next(new HttpError(401, "Missing authentication token"))
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      clockTolerance: 5,
      ...(env.NEON_AUTH_ISSUER
        ? { issuer: env.NEON_AUTH_ISSUER, audience: env.NEON_AUTH_ISSUER }
        : {}),
    })

    if (!payload.sub) {
      return next(new HttpError(401, "Token is missing a subject"))
    }

    req.userId = payload.sub
    next()
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return next(new HttpError(401, "Session expired"))
    }
    console.error("Token verification failed:", error)
    next(new HttpError(401, "Invalid authentication token"))
  }
}
