import { describe, expect, it } from "@effect/vitest"
import { arcValue, sunburstArcs, treeDepth } from "./sunburst.ts"

const data = [
  {
    name: "A",
    color: "red",
    children: [
      { name: "A1", value: 30 },
      { name: "A2", value: 10, color: "blue" }
    ]
  },
  { name: "B", value: 20 }
]

describe("Sunburst layout, as recharts' SunburstChart", () => {
  it("measures values and depth", () => {
    expect(arcValue(data[0] ?? { name: "" })).toBe(40)
    expect(arcValue({ name: "own", value: 5, children: [{ name: "x", value: 1 }] })).toBe(5)
    expect(arcValue({ name: "none" })).toBe(0)
    expect(treeDepth(data)).toBe(3)
    expect(treeDepth([])).toBe(1)
  })

  it("splits the angle by value and the radius by depth, root included", () => {
    const arcs = sunburstArcs(data, { radius: 150, innerRadius: 60, startAngle: 0, endAngle: 360 })
    expect(arcs.map((arc) => arc.name)).toEqual(["A", "A1", "A2", "B"])
    expect(arcs[0]).toMatchObject({
      startAngle: 0,
      endAngle: 240,
      innerRadius: 60,
      outerRadius: 90,
      depth: 1,
      color: "red"
    })
    expect(arcs[1]).toMatchObject({ startAngle: 0, endAngle: 180, innerRadius: 90, outerRadius: 120, color: "red" })
    expect(arcs[2]).toMatchObject({ startAngle: 180, endAngle: 240, depth: 2, color: "blue" })
    expect(arcs[3]).toMatchObject({ startAngle: 240, endAngle: 360, color: undefined })
  })

  it("draws nothing around an empty total", () => {
    const arcs = sunburstArcs([{ name: "zero", value: 0 }], {
      radius: 100,
      innerRadius: 0,
      startAngle: 90,
      endAngle: -270
    })
    expect(arcs[0]).toMatchObject({ startAngle: 90, endAngle: 90 })
  })
})
