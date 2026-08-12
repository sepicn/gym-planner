import { describe, expect, it } from "vitest"
import { parseModelJson } from "../lib/parseModelJson"

describe("parseModelJson", () => {
  it("parses plain JSON", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 })
  })

  it("strips a ```json fence", () => {
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it("strips a bare ``` fence", () => {
    expect(parseModelJson('```\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it("ignores surrounding whitespace", () => {
    expect(parseModelJson('\n\n  {"a":1}  \n')).toEqual({ a: 1 })
  })

  it("digs the object out of a chatty response", () => {
    const content = 'Sure! Here is your plan:\n{"a":1}\nLet me know if you want changes.'
    expect(parseModelJson(content)).toEqual({ a: 1 })
  })

  it("keeps nested braces intact when digging", () => {
    const content = 'Here you go: {"a":{"b":[1,2]}} enjoy'
    expect(parseModelJson(content)).toEqual({ a: { b: [1, 2] } })
  })

  it("throws when there is no JSON at all", () => {
    expect(() => parseModelJson("I cannot help with that")).toThrow(
      "response was not JSON",
    )
  })

  it("throws on a truncated object rather than returning junk", () => {
    expect(() => parseModelJson('{"a":1')).toThrow()
  })
})
