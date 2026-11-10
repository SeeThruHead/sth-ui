import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import { firstEnabled, lastEnabled, rovingMove, settledIndex } from "./roving.ts"
import type { RovingOptions } from "./roving.ts"

const press = (key: string, ctrlKey = false) => ({ key, ctrlKey })

const move = (key: string, current: number, options: RovingOptions, ctrlKey = false) =>
  Option.getOrUndefined(rovingMove(press(key, ctrlKey), current, options))

const disabled =
  (...indices: ReadonlyArray<number>) =>
  (index: number) =>
    indices.includes(index)

describe("roving index in a list, as Mantine's useRovingIndex", () => {
  const five = { total: 5 }

  it("moves with the arrows of its orientation only", () => {
    expect(move("ArrowRight", 0, five)).toBe(1)
    expect(move("ArrowLeft", 2, five)).toBe(1)
    expect(move("ArrowDown", 0, five)).toBeUndefined()
    expect(move("ArrowUp", 2, five)).toBeUndefined()
    expect(move("ArrowDown", 0, { total: 5, orientation: "vertical" })).toBe(1)
    expect(move("ArrowUp", 2, { total: 5, orientation: "vertical" })).toBe(1)
    expect(move("ArrowRight", 0, { total: 5, orientation: "vertical" })).toBeUndefined()
    expect(move("ArrowLeft", 2, { total: 5, orientation: "vertical" })).toBeUndefined()
    expect(move("ArrowDown", 0, { total: 5, orientation: "both" })).toBe(1)
    expect(move("ArrowRight", 0, { total: 5, orientation: "both" })).toBe(1)
    expect(move("Enter", 0, five)).toBeUndefined()
  })

  it("wraps unless loop is off, skips disabled items and mirrors in right to left", () => {
    expect(move("ArrowRight", 4, five)).toBe(0)
    expect(move("ArrowLeft", 0, five)).toBe(4)
    expect(move("ArrowRight", 4, { total: 5, loop: false })).toBeUndefined()
    expect(move("ArrowLeft", 0, { total: 5, loop: false })).toBeUndefined()
    expect(move("ArrowRight", 0, { total: 5, isItemDisabled: disabled(1, 2) })).toBe(3)
    expect(move("ArrowLeft", 0, { total: 5, isItemDisabled: disabled(4) })).toBe(3)
    expect(move("ArrowRight", 2, { total: 5, dir: "rtl" })).toBe(1)
    expect(move("ArrowLeft", 2, { total: 5, dir: "rtl" })).toBe(3)
    expect(move("ArrowRight", 0, { total: 3, isItemDisabled: disabled(1, 2) })).toBeUndefined()
  })

  it("jumps home and end to the first and last enabled items", () => {
    expect(move("Home", 3, { total: 5, isItemDisabled: disabled(0) })).toBe(1)
    expect(move("End", 1, { total: 5, isItemDisabled: disabled(4) })).toBe(3)
    expect(firstEnabled({ total: 2, isItemDisabled: () => true })).toBe(0)
    expect(lastEnabled({ total: 2, isItemDisabled: () => true })).toBe(0)
  })

  it("settles the focused index when items go away or become disabled", () => {
    expect(settledIndex(6, { total: 4 })).toBe(3)
    expect(settledIndex(1, { total: 4, isItemDisabled: disabled(0, 1) })).toBe(2)
    expect(settledIndex(2, { total: 4 })).toBe(2)
    expect(settledIndex(3, { total: 0 })).toBe(3)
  })

  it.prop(
    "always lands on an enabled item within the list",
    [
      Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 12 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 11 })),
      Schema.Literals(["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"]),
      Schema.Array(Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 11 }))),
      Schema.Boolean
    ],
    ([total, at, key, off, loop]) => {
      const options = { total, loop, orientation: "both" as const, isItemDisabled: disabled(...off) }
      const current = at % total
      Option.map(rovingMove(press(key), current, options), (index) => {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(total)
        expect(off.includes(index) && !off.includes(0)).toBe(false)
      })
    }
  )
})

describe("roving index in a grid", () => {
  const grid = { total: 10, columns: 4 }

  it("moves within a row and stops at its edges", () => {
    expect(move("ArrowRight", 1, grid)).toBe(2)
    expect(move("ArrowLeft", 1, grid)).toBe(0)
    expect(move("ArrowRight", 3, grid)).toBeUndefined()
    expect(move("ArrowLeft", 4, grid)).toBeUndefined()
    expect(move("ArrowRight", 4, { ...grid, isItemDisabled: disabled(5) })).toBe(6)
    expect(move("ArrowRight", 1, { ...grid, isItemDisabled: disabled(2, 3) })).toBeUndefined()
    expect(move("ArrowLeft", 1, { ...grid, dir: "rtl" })).toBe(2)
    expect(move("ArrowRight", 2, { ...grid, dir: "rtl", isItemDisabled: disabled(1) })).toBe(0)
  })

  it("moves between rows in the same column and stops at the ends", () => {
    expect(move("ArrowDown", 1, grid)).toBe(5)
    expect(move("ArrowUp", 5, grid)).toBe(1)
    expect(move("ArrowUp", 1, grid)).toBeUndefined()
    expect(move("ArrowDown", 6, grid)).toBeUndefined()
    expect(move("ArrowDown", 7, grid)).toBeUndefined()
    expect(move("ArrowDown", 1, { ...grid, isItemDisabled: disabled(5) })).toBe(9)
  })

  it("jumps to the row's ends, or the grid's with Ctrl", () => {
    expect(move("Home", 6, grid)).toBe(4)
    expect(move("End", 4, grid)).toBe(7)
    expect(move("End", 8, grid)).toBe(9)
    expect(move("Home", 6, grid, true)).toBe(0)
    expect(move("End", 2, grid, true)).toBe(9)
    expect(move("Enter", 2, grid)).toBeUndefined()
  })
})
