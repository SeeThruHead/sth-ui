import { describe, expect, it } from "@effect/vitest"
import { areaPath, linePath, niceDomain, niceTicks, segments, trendColor } from "./geometry.ts"

const points = [
  { x: 0, y: 10 },
  { x: 10, y: 0 },
  { x: 20, y: 10 }
]

describe("Sparkline geometry, as recharts and d3 draw it", () => {
  it("rounds the value axis up to recharts' nice domain", () => {
    expect(niceDomain([10, 20, 40, 20, 40, 10, 50])).toEqual([0, 60])
    expect(niceDomain([1, 2, 3])).toEqual([0, 3])
    expect(niceDomain([-5, 5])).toEqual([-6, 6])
    expect(niceDomain([-10, -2])).toEqual([-12, 0])
    expect(niceDomain([0, 0])).toEqual([0, 1])
    expect(niceDomain([-1, 10])).toEqual([-4, 12])
    expect(niceTicks([10, 50])).toEqual([0, 15, 30, 45, 60])
    expect(niceTicks([0])).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(niceDomain([7, 7, 7])).toEqual([0, 8])
  })

  it("draws each curve type", () => {
    expect(linePath([], "linear")).toBe("")
    expect(linePath([{ x: 1, y: 2 }], "linear")).toBe("M1,2Z")
    expect(linePath(points.slice(0, 2), "natural")).toBe("M0,10L10,0")
    expect(linePath(points, "linear")).toBe("M0,10L10,0L20,10")
    expect(linePath(points, "step")).toBe("M0,10L5,10L5,0L10,0L15,0L15,10L20,10")
    expect(linePath(points, "stepBefore")).toBe("M0,10L0,10L0,0L10,0L10,0L10,10L20,10")
    expect(linePath(points, "stepAfter")).toBe("M0,10L10,10L10,0L10,0L20,0L20,10L20,10")
    expect(linePath(points, "bump")).toBe("M0,10C5,10,5,0,10,0C15,0,15,10,20,10")
    expect(linePath(points, "monotone")).toBe(
      "M0,10C3.3333333333333335,5,6.666666666666666,0,10,0C13.333333333333334,0,16.666666666666668,5,20,10"
    )
    expect(linePath(points, "natural")).toBe(
      "M0,10C3.333333333333333,5,6.666666666666666,0,10,0C13.333333333333334,0,16.666666666666668,5,20,10"
    )
    expect(linePath([...points, { x: 30, y: 0 }], "natural")).toContain("C")
    expect(areaPath(points, "linear", 10)).toBe("M0,10L10,0L20,10L20,10L0,10Z")
    expect(areaPath([], "linear", 10)).toBe("")
  })

  it("connects or breaks at missing values", () => {
    expect(segments([1, null, 3], true)).toEqual([
      [
        { index: 0, value: 1 },
        { index: 2, value: 3 }
      ]
    ])
    expect(segments([1, null, 3, 4], false)).toEqual([
      [{ index: 0, value: 1 }],
      [
        { index: 2, value: 3 },
        { index: 3, value: 4 }
      ]
    ])
    expect(segments([null], true)).toEqual([])
  })

  it("picks the trend colour from the first and last values", () => {
    const colors = { positive: "teal", negative: "red", neutral: "gray" }
    expect(trendColor([1, 2], colors)).toBe("teal")
    expect(trendColor([2, 1], colors)).toBe("red")
    expect(trendColor([1, 1], colors)).toBe("gray")
    expect(trendColor([null, 1], colors)).toBe("gray")
    expect(trendColor([], colors)).toBe("gray")
    expect(trendColor([1, 1], { positive: "teal", negative: "red" })).toBe("teal")
  })
})
