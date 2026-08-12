import type { NextFunction, Request, Response } from "express"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// Only the key source is faked. jwtVerify stays real, so these tests exercise
// actual signature, expiry and claim checking against a local key pair.
const keys = vi.hoisted(() => ({
  serverPublicKey: null as unknown,
}))

vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>()
  return {
    ...actual,
    createRemoteJWKSet: () => async () => keys.serverPublicKey,
  }
})

const { generateKeyPair, SignJWT } = await import("jose")
const { getUserId, requireAuth } = await import("../middleware/requireAuth")
const { HttpError } = await import("../lib/HttpError")

const USER_ID = "11111111-2222-3333-4444-555555555555"

let signAsServer: (jwt: SignJWTLike) => Promise<string>
let signAsAttacker: (jwt: SignJWTLike) => Promise<string>

type SignJWTLike = InstanceType<typeof SignJWT>

beforeAll(async () => {
  const server = await generateKeyPair("EdDSA", { crv: "Ed25519" })
  const attacker = await generateKeyPair("EdDSA", { crv: "Ed25519" })

  keys.serverPublicKey = server.publicKey
  signAsServer = (jwt) => jwt.sign(server.privateKey)
  signAsAttacker = (jwt) => jwt.sign(attacker.privateKey)
})

function baseToken() {
  return new SignJWT({ email: "lifter@example.com" })
    .setProtectedHeader({ alg: "EdDSA" })
    .setSubject(USER_ID)
    .setIssuedAt()
    .setExpirationTime("15m")
}

async function callMiddleware(authorization?: string) {
  const req = {
    headers: authorization ? { authorization } : {},
  } as unknown as Request

  let captured: unknown
  const next = ((error?: unknown) => {
    captured = error
  }) as NextFunction

  await requireAuth(req, {} as Response, next)
  return { req, error: captured }
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("requireAuth", () => {
  it("accepts a token signed by the project key and exposes its subject", async () => {
    const token = await signAsServer(baseToken())
    const { req, error } = await callMiddleware(`Bearer ${token}`)

    expect(error).toBeUndefined()
    expect(req.userId).toBe(USER_ID)
  })

  it("rejects a well formed token signed by someone else", async () => {
    const token = await signAsAttacker(baseToken())
    const { req, error } = await callMiddleware(`Bearer ${token}`)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as InstanceType<typeof HttpError>).status).toBe(401)
    expect(req.userId).toBeUndefined()
  })

  it("rejects an expired token with a distinct message", async () => {
    const token = await signAsServer(
      new SignJWT({})
        .setProtectedHeader({ alg: "EdDSA" })
        .setSubject(USER_ID)
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60),
    )
    const { error } = await callMiddleware(`Bearer ${token}`)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as Error).message).toBe("Session expired")
  })

  it("rejects a valid signature that carries no subject", async () => {
    const token = await signAsServer(
      new SignJWT({ email: "x@y.z" })
        .setProtectedHeader({ alg: "EdDSA" })
        .setIssuedAt()
        .setExpirationTime("15m"),
    )
    const { req, error } = await callMiddleware(`Bearer ${token}`)

    expect((error as Error).message).toBe("Token is missing a subject")
    expect(req.userId).toBeUndefined()
  })

  it.each([
    ["no header at all", undefined],
    ["a non-bearer scheme", "Basic aGk6dGhlcmU="],
    ["an empty bearer value", "Bearer "],
    ["a raw token without the scheme", "eyJhbGciOiJFZERTQSJ9.e30.sig"],
  ])("rejects %s", async (_label, header) => {
    const { req, error } = await callMiddleware(header)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as Error).message).toBe("Missing authentication token")
    expect(req.userId).toBeUndefined()
  })

  it("rejects a bearer value that is not a JWT", async () => {
    const { error } = await callMiddleware("Bearer not.a.jwt")

    expect((error as Error).message).toBe("Invalid authentication token")
  })
})

describe("getUserId", () => {
  it("returns the id that requireAuth attached", () => {
    expect(getUserId({ userId: USER_ID } as Request)).toBe(USER_ID)
  })

  // Prisma treats an undefined filter as "no condition", so a route reached
  // without requireAuth must fail loudly rather than query unscoped.
  it.each([
    ["the middleware never ran", {}],
    ["the id is an empty string", { userId: "" }],
  ])("throws a 401 when %s", (_label, req) => {
    expect(() => getUserId(req as Request)).toThrow(HttpError)
    expect(() => getUserId(req as Request)).toThrow("Not authenticated")
  })
})
