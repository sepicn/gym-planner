// Models ignore "respond with JSON only" often enough that unwrapping the
// response is cheaper than another round trip.
export function parseModelJson(content: string): unknown {
  const unfenced = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim()

  try {
    return JSON.parse(unfenced)
  } catch {
    const start = unfenced.indexOf("{")
    const end = unfenced.lastIndexOf("}")
    if (start === -1 || end <= start) {
      throw new Error("response was not JSON")
    }
    return JSON.parse(unfenced.slice(start, end + 1))
  }
}
