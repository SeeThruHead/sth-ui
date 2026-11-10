import { describe, expect, it } from "@effect/vitest"
import { trapezoids } from "./funnel.ts"

describe("funnel layout, as recharts' Funnel", () => {
  it("stacks rows whose top edge follows the value and bottom edge the next value", () => {
    const [first, second] = trapezoids([100, 50], 210)
    expect(first?.path).toBe("M5,5L205,5L155,105L55,105Z")
    expect(second?.path).toBe("M55,105L155,105L105,205L105,205Z")
    expect([second?.left, second?.right, second?.top, second?.bottom]).toEqual([55, 155, 105, 205])
  })

  it("draws nothing wide when every value is zero", () => {
    expect(trapezoids([0], 110)[0]?.path).toBe("M55,5L55,5L55,105L55,105Z")
    expect(trapezoids([], 110)).toEqual([])
  })
})
