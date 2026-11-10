import { describe, expect, it } from "@effect/vitest"
import { cellKey, cellMap, legendWidth, matrixDomain, uniqueValues } from "./matrix.ts"

const data = [
  { x: "Mon", y: "AM", value: 3 },
  { x: "Tue", y: "AM", value: null },
  { x: "Mon", y: "PM", value: 9 },
  { x: "Tue", y: "PM", value: Number.NaN }
]

describe("MatrixChart helpers, as Mantine's", () => {
  it("keys cells so that x and y cannot run together", () => {
    expect(cellKey("a:b", "c")).not.toBe(cellKey("a", "b:c"))
    expect(cellMap(data).get(cellKey("Mon", "PM"))?.value).toBe(9)
  })

  it("lists axis values in first-seen order unless labels are given", () => {
    expect(uniqueValues(data, "x", undefined)).toEqual(["Mon", "Tue"])
    expect(uniqueValues(data, "y", ["PM", "AM"])).toEqual(["PM", "AM"])
  })

  it("finds the domain from finite values", () => {
    expect(matrixDomain(data, undefined)).toEqual([3, 9])
    expect(matrixDomain(data, [0, 20])).toEqual([0, 20])
    expect(matrixDomain([{ x: "a", y: "b", value: null }], undefined)).toEqual([0, 0])
  })

  it("measures the legend", () => {
    expect(legendWidth(["Less", "More"], 10, 4, 20, 1)).toBe(24 + 6 + 104 + 6 + 24)
  })
})
