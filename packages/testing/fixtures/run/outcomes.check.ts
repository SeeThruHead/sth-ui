import { describe, expect, it } from "vitest"

const attempts = { count: 0 }

describe("outcomes", () => {
  it("passes", () => expect(1).toBe(1))
  it("fails", () => expect("first line\nsecond line").toBe("other"))
  it("passes on a retry", () => {
    attempts.count += 1
    expect(attempts.count).toBeGreaterThan(1)
  })
  it.skip("is skipped", () => expect(1).toBe(1))
})
