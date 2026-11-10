import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import { directionOf, nextControl } from "./keys.ts"
import type { ControlIndex, Direction } from "./keys.ts"

const month = [7, 7, 7, 7, 7]
const twoMonths = [month, month]
const years = [[3, 3, 3, 1]]
const none = () => false
const at = (levelIndex: number, rowIndex: number, cellIndex: number): ControlIndex => ({
  levelIndex,
  rowIndex,
  cellIndex
})
const move = (
  size: ReadonlyArray<ReadonlyArray<number>>,
  from: ControlIndex,
  direction: Direction,
  skip: (at: ControlIndex) => boolean = none
) => Option.getOrUndefined(nextControl(size, from, direction, skip))

const disabled = (index: ControlIndex) => index.rowIndex === 1 && index.cellIndex < 6

describe("calendar keyboard, as Mantine's handleControlKeyDown", () => {
  it("moves within a month and across to the next or previous month", () => {
    expect(move(twoMonths, at(0, 1, 3), "up")).toEqual(at(0, 0, 3))
    expect(move(twoMonths, at(0, 1, 3), "down")).toEqual(at(0, 2, 3))
    expect(move(twoMonths, at(0, 1, 3), "left")).toEqual(at(0, 1, 2))
    expect(move(twoMonths, at(0, 1, 3), "right")).toEqual(at(0, 1, 4))
    expect(move(twoMonths, at(0, 1, 0), "left")).toEqual(at(0, 0, 6))
    expect(move(twoMonths, at(0, 1, 6), "right")).toEqual(at(0, 2, 0))
    expect(move(twoMonths, at(0, 4, 6), "right")).toEqual(at(1, 0, 0))
    expect(move(twoMonths, at(1, 0, 0), "left")).toEqual(at(0, 4, 6))
    expect(move(twoMonths, at(0, 4, 2), "down")).toEqual(at(1, 0, 2))
    expect(move(twoMonths, at(1, 0, 2), "up")).toEqual(at(0, 4, 2))
  })

  it("stops at the edges of the first and last months", () => {
    expect(move(twoMonths, at(0, 0, 3), "up")).toBeUndefined()
    expect(move(twoMonths, at(0, 0, 0), "left")).toBeUndefined()
    expect(move(twoMonths, at(1, 4, 6), "right")).toBeUndefined()
    expect(move(twoMonths, at(1, 4, 3), "down")).toBeUndefined()
  })

  it("handles a short last row, as in the years list", () => {
    expect(move(years, at(0, 2, 0), "down")).toEqual(at(0, 3, 0))
    expect(move(years, at(0, 2, 2), "down")).toBeUndefined()
    expect(move([...years, ...years], at(0, 2, 2), "down")).toEqual(at(1, 0, 2))
    expect(move([...years, ...years], at(1, 0, 0), "up")).toEqual(at(0, 3, 0))
    expect(move([...years, ...years], at(1, 0, 2), "up")).toEqual(at(0, 2, 2))
  })

  it("skips controls it cannot focus", () => {
    expect(move(twoMonths, at(0, 0, 6), "right", disabled)).toEqual(at(0, 1, 6))
    expect(move(twoMonths, at(0, 0, 0), "down", (index) => index.rowIndex > 0)).toEqual(at(1, 0, 0))
    expect(move(twoMonths, at(1, 0, 0), "down", (index) => index.rowIndex > 0)).toBeUndefined()
  })

  it.prop(
    "always lands on an existing control",
    [
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 4 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 6 })),
      Schema.Literals(["up", "down", "left", "right"])
    ],
    ([level, row, cell, direction]) => {
      Option.map(nextControl(twoMonths, at(level, row, cell), direction, none), (next) => {
        expect(next.levelIndex).toBeGreaterThanOrEqual(0)
        expect(next.levelIndex).toBeLessThan(2)
        expect(next.rowIndex).toBeLessThan(5)
        expect(next.cellIndex).toBeLessThan(7)
      })
    }
  )

  it("reads arrow keys", () => {
    expect(directionOf("ArrowUp")).toEqual(Option.some("up"))
    expect(directionOf("Enter")).toEqual(Option.none())
  })
})
