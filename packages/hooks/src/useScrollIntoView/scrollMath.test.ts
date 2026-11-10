import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { easeInOutQuad, scrollAt, scrollChange } from "./scrollMath.ts"

describe("scroll into view, as Mantine's useScrollIntoView", () => {
  it("eases in and out", () => {
    expect(easeInOutQuad(0)).toBe(0)
    expect(easeInOutQuad(0.25)).toBe(0.125)
    expect(easeInOutQuad(0.5)).toBe(0.5)
    expect(easeInOutQuad(1)).toBe(1)
  })

  it("aligns the target to the start, end or center of the view", () => {
    const target = { start: 500, size: 100 }
    expect(scrollChange(target, 800, "start", 20)).toBe(480)
    expect(scrollChange(target, 800, "end", 20)).toBe(-180)
    expect(scrollChange(target, 800, "center", 20)).toBe(150)
  })

  it.prop(
    "starts where it is and ends at the target",
    [
      Schema.Finite.check(Schema.isBetween({ minimum: -5000, maximum: 5000 })),
      Schema.Finite.check(Schema.isBetween({ minimum: -5000, maximum: 5000 }))
    ],
    ([start, change]) => {
      expect(scrollAt(start, change, 0)).toBeCloseTo(start)
      expect(scrollAt(start, change, 1)).toBeCloseTo(start + change)
      expect(scrollAt(start, change, 7)).toBeCloseTo(start + change)
      expect(scrollAt(start, change, 0.5, (t) => t)).toBeCloseTo(start + change / 2)
    }
  )
})
