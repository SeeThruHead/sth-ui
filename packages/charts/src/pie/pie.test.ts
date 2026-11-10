import { describe, expect, it } from "@effect/vitest"
import { labelText, polar, sectorPath, sectors } from "./pie.ts"

const layout = { cx: 100, cy: 100, innerRadius: 60, outerRadius: 80, startAngle: 0, endAngle: 360, paddingAngle: 0 }

const cells = [
  { name: "USA", value: 400, color: "indigo.6" },
  { name: "India", value: 300, color: "yellow.6" },
  { name: "Other", value: 300, color: "gray.6" }
]

describe("pie layout, as recharts' Pie draws it", () => {
  it("places points counter-clockwise from three o'clock", () => {
    expect(polar(0, 0, 10, 0)).toEqual({ x: 10, y: 0 })
    expect(Math.round(polar(0, 0, 10, 90).y)).toBe(-10)
  })

  it("splits the angle by value, leaving padding between sectors", () => {
    const laid = sectors(cells, layout)
    expect(laid.map((sector) => [sector.startAngle, sector.endAngle])).toEqual([
      [0, 144],
      [144, 252],
      [252, 360]
    ])
    expect(laid[0]?.percent).toBe(0.4)
    expect(laid[0]?.label.anchor).toBe("start")
    expect(laid[1]?.label.anchor).toBe("end")
    expect(laid[0]?.line).toBe("M124.721,23.915L130.902,4.894")
    const padded = sectors(cells, { ...layout, paddingAngle: 6 })
    expect(padded.map((sector) => Math.round(sector.startAngle))).toEqual([0, 143, 251])
    const half = sectors(cells, { ...layout, startAngle: 180, endAngle: 0, paddingAngle: 4 })
    expect(half.map((sector) => Math.round(sector.endAngle))).toEqual([111, 56, 0])
    expect(sectors([{ name: "None", value: 0, color: "red" }], layout)[0]?.percent).toBe(0)
  })

  it("draws sectors with and without a hole", () => {
    expect(sectorPath(layout, 0, 90)).toBe("M180,100A80,80,0,0,0,100,20L100,40A60,60,0,0,1,160,100Z")
    expect(sectorPath({ ...layout, innerRadius: 0 }, 0, 270)).toBe("M180,100A80,80,0,1,0,100,180L100,100Z")
    expect(sectorPath(layout, 0, 360)).toContain("A80,80,0,1,0,180,100.001")
  })

  it("labels a sector by value, percent or name", () => {
    const [first] = sectors(cells, layout)
    if (first === undefined) return
    expect(labelText(first, "value", undefined)).toBe("400")
    expect(labelText(first, "value", (value) => `${value} people`)).toBe("400 people")
    expect(labelText(first, "percent", undefined)).toBe("40%")
    expect(labelText(first, "name", undefined)).toBe("USA")
  })
})
