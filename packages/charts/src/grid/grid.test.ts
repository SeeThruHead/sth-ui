import { describe, expect, it } from "@effect/vitest"
import {
  bandCenter,
  bandIndex,
  bandPoints,
  endShifts,
  keptTicks,
  shiftedSpans,
  nearestIndex,
  stackedBands,
  numberAt,
  seriesPoints,
  valueTicks,
  xFraction,
  yFraction
} from "./grid.ts"

const data = [
  { date: "Mar 22", Apples: 2890, Oranges: 2338 },
  { date: "Mar 23", Apples: 2756, Oranges: null },
  { date: "Mar 24", Apples: 3322, Oranges: 2452 }
]

describe("grid chart layout, as recharts lays out a line chart", () => {
  it("spreads categories edge to edge and scales values to nice ticks", () => {
    expect(xFraction(0, 3)).toBe(0)
    expect(xFraction(2, 3)).toBe(1)
    expect(xFraction(0, 1)).toBe(0.5)
    expect(valueTicks(data, [{ name: "Apples", color: "indigo.6" }])).toEqual([0, 850, 1700, 2550, 3400])
    expect(valueTicks(data, [{ name: "Oranges", color: "blue.6" }])).toEqual([0, 650, 1300, 1950, 2600])
    expect(yFraction(900, [0, 900, 1800, 2700, 3600])).toBe(0.75)
    expect(yFraction(1, [])).toBe(0)
    expect(numberAt(data[1] ?? {}, "Oranges")).toBeNull()
  })

  it("joins or breaks a series at missing values", () => {
    expect(seriesPoints(data, "Oranges", [0, 3000], true)).toHaveLength(1)
    expect(seriesPoints(data, "Oranges", [0, 3000], false).map((run) => run.map((point) => point.index))).toEqual([
      [0],
      [2]
    ])
    expect(seriesPoints(data, "Missing", [0, 1], true)).toEqual([])
    expect(seriesPoints(data, "Apples", [0, 3000], false)[0]?.map((point) => point.index)).toEqual([0, 1, 2])
  })

  it("finds the category nearest the pointer", () => {
    expect(nearestIndex(0.3, 3)).toBe(1)
    expect(nearestIndex(-1, 3)).toBe(0)
    expect(nearestIndex(2, 3)).toBe(2)
    expect(nearestIndex(0.5, 1)).toBe(0)
  })

  it("keeps the first and last tick labels and drops the ones that would overlap", () => {
    const spans = [0, 30, 60, 90].map((left) => ({ left, right: left + 40 }))
    expect(keptTicks(spans)).toEqual([0, 3])
    expect(keptTicks([0, 50, 100, 150].map((left) => ({ left, right: left + 40 })))).toEqual([0, 1, 2, 3])
    expect(keptTicks([0, 50, 80].map((left) => ({ left, right: left + 40 })))).toEqual([0, 2])
    expect(keptTicks([0, 20].map((left) => ({ left, right: left + 40 })))).toEqual([0, 1])
    expect(keptTicks([])).toEqual([])
  })

  it("stacks series on one another, or to 100% of each row", () => {
    const series = [
      { name: "Apples", color: "indigo.6" },
      { name: "Oranges", color: "blue.6" }
    ]
    const stacked = stackedBands(data, series, false)
    expect(stacked[1]?.map((band) => [band.low, band.high])).toEqual([
      [2890, 5228],
      [2756, 2756],
      [3322, 5774]
    ])
    const percent = stackedBands(
      [
        { date: "a", Apples: 1, Oranges: 3 },
        { date: "b", Apples: 0, Oranges: 0 }
      ],
      series,
      true
    )
    expect(percent[0]?.map((band) => band.high)).toEqual([0.25, 0])
    expect(percent[1]?.map((band) => band.high)).toEqual([1, 0])
    expect(bandPoints(stacked[0] ?? [], 3, [0, 6000], "high")[2]).toEqual({ index: 2, x: 100, y: 44.63333333333333 })
  })

  it("places bar categories in equal bands", () => {
    expect(bandCenter(0, 4)).toBe(0.125)
    expect(bandCenter(0, 0)).toBe(0.5)
    expect(bandIndex(0.3, 4)).toBe(1)
    expect(bandIndex(1, 4)).toBe(3)
    expect(bandIndex(-0.2, 4)).toBe(0)
    expect(bandIndex(0.5, 0)).toBe(0)
  })

  it("moves the end labels inside the axis, as recharts' preserveStartEnd", () => {
    const spans = [
      { left: -20, right: 20 },
      { left: 80, right: 120 },
      { left: 180, right: 220 }
    ]
    const shifts = endShifts(spans, { left: 0, right: 200 })
    expect(shifts).toEqual({ head: 20, tail: -20 })
    expect(shiftedSpans(spans, shifts)).toEqual([
      { left: 0, right: 40 },
      { left: 80, right: 120 },
      { left: 160, right: 200 }
    ])
    expect(endShifts([{ left: 10, right: 50 }], { left: 0, right: 200 })).toEqual({ head: 0, tail: 0 })
    expect(shiftedSpans([{ left: -10, right: 30 }], { head: 10, tail: 0 })).toEqual([{ left: 0, right: 40 }])
    expect(endShifts([], { left: 0, right: 200 })).toEqual({ head: 0, tail: 0 })
  })
})
