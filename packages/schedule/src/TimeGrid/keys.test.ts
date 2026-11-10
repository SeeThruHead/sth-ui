import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { flowTarget, slotTarget } from "./keys.ts"

const size = { columns: 7, slots: 10 }

describe("time grid keys, as handleWeekViewKeyDown", () => {
  it("moves between slots and days, stopping at the edges", () => {
    expect(slotTarget("ArrowUp", { column: 2, slot: 3 }, size)).toEqual(Option.some({ column: 2, slot: 2 }))
    expect(slotTarget("ArrowUp", { column: 2, slot: 0 }, size)).toEqual(Option.none())
    expect(slotTarget("ArrowDown", { column: 2, slot: 3 }, size)).toEqual(Option.some({ column: 2, slot: 4 }))
    expect(slotTarget("ArrowDown", { column: 2, slot: 9 }, size)).toEqual(Option.none())
    expect(slotTarget("ArrowLeft", { column: 2, slot: 3 }, size)).toEqual(Option.some({ column: 1, slot: 3 }))
    expect(slotTarget("ArrowLeft", { column: 0, slot: 3 }, size)).toEqual(Option.none())
    expect(slotTarget("ArrowRight", { column: 2, slot: 3 }, size)).toEqual(Option.some({ column: 3, slot: 3 }))
    expect(slotTarget("ArrowRight", { column: 6, slot: 3 }, size)).toEqual(Option.none())
    expect(slotTarget("Enter", { column: 2, slot: 3 }, size)).toEqual(Option.none())
  })
})

describe("flowing keys, as handleYearViewKeyDown", () => {
  it("moves in reading order, wrapping between rows", () => {
    const sizes = [7, 7, 3]
    expect(flowTarget("ArrowUp", { row: 1, item: 4 }, sizes)).toEqual(Option.some({ row: 0, item: 4 }))
    expect(flowTarget("ArrowUp", { row: 0, item: 4 }, sizes)).toEqual(Option.none())
    expect(flowTarget("ArrowDown", { row: 1, item: 5 }, sizes)).toEqual(Option.some({ row: 2, item: 2 }))
    expect(flowTarget("ArrowDown", { row: 2, item: 1 }, sizes)).toEqual(Option.none())
    expect(flowTarget("ArrowLeft", { row: 1, item: 3 }, sizes)).toEqual(Option.some({ row: 1, item: 2 }))
    expect(flowTarget("ArrowLeft", { row: 1, item: 0 }, sizes)).toEqual(Option.some({ row: 0, item: 6 }))
    expect(flowTarget("ArrowLeft", { row: 0, item: 0 }, sizes)).toEqual(Option.none())
    expect(flowTarget("ArrowRight", { row: 1, item: 3 }, sizes)).toEqual(Option.some({ row: 1, item: 4 }))
    expect(flowTarget("ArrowRight", { row: 1, item: 6 }, sizes)).toEqual(Option.some({ row: 2, item: 0 }))
    expect(flowTarget("ArrowRight", { row: 2, item: 2 }, sizes)).toEqual(Option.none())
    expect(flowTarget("Home", { row: 1, item: 2 }, sizes)).toEqual(Option.none())
  })
})
