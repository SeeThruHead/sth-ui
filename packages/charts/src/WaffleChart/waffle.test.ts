import { describe, expect, it } from "@effect/vitest"
import { allocateCells, cellLayout, cellPosition, normalizeValue, summary } from "./waffle.ts"

const data = [
  { name: "Completed", value: 68, color: "teal" },
  { name: "In progress", value: 22, color: "yellow" },
  { name: "Failed", value: 10, color: "red" }
]

describe("WaffleChart layout, as Mantine's WaffleChart", () => {
  it("allocates cells by largest remainder and leaves the rest empty", () => {
    const cells = allocateCells(data, 100, undefined)
    expect(cells.filter((cell) => cell === 0)).toHaveLength(68)
    expect(cells.filter((cell) => cell === 2)).toHaveLength(10)
    expect(cells).toHaveLength(100)
    const thirds = allocateCells(
      [
        { name: "a", value: 1, color: "red" },
        { name: "b", value: 1, color: "red" },
        { name: "c", value: 1, color: "red" }
      ],
      10,
      undefined
    )
    expect(thirds.filter((cell) => cell === 0)).toHaveLength(4)
    expect(allocateCells(data, 100, 200).filter((cell) => cell === -1)).toHaveLength(50)
    expect(allocateCells([{ name: "none", value: 0, color: "red" }], 4, undefined)).toEqual([-1, -1, -1, -1])
  })

  it("treats negative and non-finite values as zero", () => {
    expect([normalizeValue(-5), normalizeValue(Number.NaN), normalizeValue(3)]).toEqual([0, 0, 3])
  })

  it("fills in each direction", () => {
    expect(cellPosition(11, 10, 10, "left-to-right")).toEqual({ row: 1, column: 1 })
    expect(cellPosition(11, 10, 10, "right-to-left")).toEqual({ row: 1, column: 8 })
    expect(cellPosition(11, 10, 10, "top-to-bottom")).toEqual({ row: 1, column: 1 })
    expect(cellPosition(11, 10, 10, "bottom-to-top")).toEqual({ row: 8, column: 1 })
  })

  it("sizes cells to fit a total width, shrinking the gap when it alone is too wide", () => {
    expect(cellLayout(10, 2, undefined)).toEqual({ cell: 20, gap: 2 })
    expect(cellLayout(10, 2, 218)).toEqual({ cell: 20, gap: 2 })
    expect(cellLayout(5, 10, 20)).toEqual({ cell: 0, gap: 5 })
  })

  it("summarises the data for assistive technology", () => {
    expect(summary(data, undefined)).toBe("Completed: 68, In progress: 22, Failed: 10 of 100")
    expect(summary(data, 150)).toBe("Completed: 68, In progress: 22, Failed: 10 of 150")
    expect(summary([], undefined)).toBe("")
  })
})
