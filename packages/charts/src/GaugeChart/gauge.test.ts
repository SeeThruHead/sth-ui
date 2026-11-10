import { describe, expect, it } from "@effect/vitest"
import { arcBoundingBox, capSections, describeArc, isAngleInArc, placeSections, valueToAngle } from "./gauge.ts"

const geometry = { cx: 100, cy: 100, r: 94, min: 0, max: 100 }

describe("GaugeChart geometry, as Mantine's GaugeChart", () => {
  it("draws one arc command for a partial arc and two half circles for a full one", () => {
    expect(describeArc(100, 100, 94, -120, 120).match(/A /g)).toHaveLength(1)
    expect(describeArc(100, 100, 94, 0, 360).match(/A /g)).toHaveLength(2)
    expect(describeArc(100, 100, 94, -180, 180).match(/A /g)).toHaveLength(2)
    expect(describeArc(100, 100, 94, 0, -360)).toContain(" 0 0 0 ")
    expect(describeArc(100, 100, 94, 120, -120)).toContain(" 0 1 0 ")
    expect(describeArc(100, 100, 94, 0, 90)).toContain(" 0 0 1 ")
  })

  it("maps and clamps values onto the arc", () => {
    expect(valueToAngle(50, 0, 100, -120, 120)).toBe(0)
    expect(valueToAngle(150, 0, 100, -120, 120)).toBe(120)
    expect(valueToAngle(5, 5, 5, -120, 120)).toBe(-120)
  })

  it("knows which angles an arc covers in either direction", () => {
    expect(isAngleInArc(0, -120, 120)).toBe(true)
    expect(isAngleInArc(180, -120, 120)).toBe(false)
    expect(isAngleInArc(180, 120, -120)).toBe(false)
    expect(isAngleInArc(10, 0, 360)).toBe(true)
  })

  it("bounds the arc, its cardinal points and the label", () => {
    const box = arcBoundingBox(100, 100, 94, 0, 360, 6, 22)
    expect([box.x, box.y, box.width, box.height]).toEqual([0, 0, 200, 200])
    const reversed = arcBoundingBox(100, 100, 94, 120, -120, 6, 22)
    const forward = arcBoundingBox(100, 100, 94, -120, 120, 6, 22)
    expect(reversed).toEqual(forward)
    expect(forward.height).toBeLessThan(200)
  })

  it("places sections from the previous bound, skipping ones that do not advance", () => {
    const placed = placeSections(
      [
        { value: 70, color: "yellow" },
        { value: 40, color: "green" },
        { value: 40, color: "gray" },
        { value: 100, color: "red" }
      ],
      geometry,
      -120,
      120
    )
    expect(placed.map((section) => section.color)).toEqual(["green", "yellow", "red"])
    expect(placeSections([{ value: 50, color: "blue" }], geometry, 120, -120)).toHaveLength(1)
    expect(capSections(placed).map((section) => section.color)).toEqual(["green", "red"])
    expect(capSections(placed.slice(0, 1))).toHaveLength(1)
    expect(capSections([])).toEqual([])
  })
})
