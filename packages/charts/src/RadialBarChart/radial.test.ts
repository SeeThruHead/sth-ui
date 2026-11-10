import { describe, expect, it } from "@effect/vitest"
import { rings, sweep } from "./radial.ts"

describe("radial bar layout, as recharts' RadialBarChart", () => {
  it("gives each item a ring from the inside out, no wider than the bar size", () => {
    expect(rings(2, 20, 100)).toEqual([
      { inner: 22.5, outer: 42.5 },
      { inner: 67.5, outer: 87.5 }
    ])
    expect(rings(10, 20, 100)[0]).toEqual({ inner: 10.9, outer: 18.1 })
    expect(rings(0, 20, 100)).toEqual([])
  })

  it("sweeps the value's share of the angle", () => {
    expect(sweep(16, 32, 90, -270)).toBe(-90)
    expect(sweep(-4, 32, 90, -270)).toBe(90)
  })
})
