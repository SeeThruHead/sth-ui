import { describe, expect, it } from "@effect/vitest"
import { rem } from "./units.ts"

describe("rem", () => {
  it("reads a number as pixels, as Mantine does", () => {
    expect(rem(24)).toBe("1.5rem")
    expect(rem(0)).toBe("0rem")
  })
})
