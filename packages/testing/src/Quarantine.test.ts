import { describe, expect, it } from "vitest"
import { decodeQuarantine, isQuarantined, quarantinedIn, skipPattern } from "./Quarantine.ts"

const entry = (app: string, test: string) => ({
  app,
  file: "src/a.test.ts",
  test,
  since: "2026-10-30",
  reason: "flaky"
})

describe("quarantine", () => {
  it("reads the checked-in list", () => {
    expect(decodeQuarantine(JSON.stringify([entry("habits", "a > b")]))).toEqual([entry("habits", "a > b")])
    expect(() => decodeQuarantine('[{"app":"habits"}]')).toThrow()
  })

  it("keeps the entries of one app", () => {
    expect(quarantinedIn([entry("habits", "x"), entry("wish-farm", "y")], "habits")).toEqual([entry("habits", "x")])
  })

  it("has no pattern when nothing is quarantined", () => {
    expect(skipPattern([])).toBeUndefined()
  })

  it("skips exactly the listed full names, special characters and all", () => {
    const pattern = skipPattern([entry("habits", "a > b (c)"), entry("habits", "d [e]?")])
    expect(pattern?.test("a > b (c)")).toBe(false)
    expect(pattern?.test("d [e]?")).toBe(false)
    expect(pattern?.test("a > b (c) and more")).toBe(true)
    expect(pattern?.test("other")).toBe(true)
  })

  it("matches a test by file and name", () => {
    const entries = [entry("habits", "a > b")]
    expect(isQuarantined(entries, "src/a.test.ts", "a > b")).toBe(true)
    expect(isQuarantined(entries, "src/other.test.ts", "a > b")).toBe(false)
  })
})
