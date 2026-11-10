import { describe, expect, it } from "@effect/vitest"
import { bubbleDiameter, domainOf } from "./bubble.ts"

describe("bubble sizes, as recharts' ZAxis range", () => {
  it("scales a bubble's area between the range's areas over the values' domain", () => {
    expect(domainOf([150, 166, 170])).toEqual([150, 170])
    expect(bubbleDiameter(150, [150, 170], [Math.PI, 4 * Math.PI])).toBe(2)
    expect(bubbleDiameter(170, [150, 170], [Math.PI, 4 * Math.PI])).toBe(4)
    expect(bubbleDiameter(5, [5, 5], [Math.PI, 4 * Math.PI])).toBe(4)
  })
})
