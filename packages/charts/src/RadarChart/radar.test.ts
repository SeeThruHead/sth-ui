import { describe, expect, it } from "@effect/vitest"
import { anchorOf, nearestAxis, polygon, spokeAt } from "./radar.ts"

describe("radar layout, as recharts' RadarChart", () => {
  it("starts at twelve o'clock and goes clockwise", () => {
    expect(spokeAt(0, 4, 100)).toEqual({ angle: 90, x: 150, y: 50 })
    expect(spokeAt(1, 4, 100)).toEqual({ angle: 0, x: 250, y: 150 })
    expect(polygon([100, 100, 100, 100])).toBe("M150,50L250,150L150,250L50,150Z")
  })

  it("anchors labels away from the centre", () => {
    expect(anchorOf(spokeAt(0, 4, 100))).toBe("middle")
    expect(anchorOf(spokeAt(1, 4, 100))).toBe("start")
    expect(anchorOf(spokeAt(3, 4, 100))).toBe("end")
  })

  it("finds the axis nearest a point", () => {
    expect(nearestAxis(150, 20, 6)).toBe(0)
    expect(nearestAxis(280, 150, 4)).toBe(1)
    expect(nearestAxis(20, 140, 4)).toBe(3)
    expect(nearestAxis(140, 20, 4)).toBe(0)
  })
})
