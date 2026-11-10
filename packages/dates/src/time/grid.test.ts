import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { gridPick, isTimeAfter, isTimeBefore, timeDisabled } from "./grid.ts"

describe("time grid, as Mantine's TimeGrid", () => {
  it("compares times by seconds", () => {
    expect(isTimeBefore("09:00", "09:00:01")).toBe(true)
    expect(isTimeAfter("10:00", "09:59:59")).toBe(true)
    expect(isTimeAfter("10:00", "10:00")).toBe(false)
  })

  it("disables times outside the limits or listed", () => {
    expect(timeDisabled("10:00", { disabled: true })).toBe(true)
    expect(timeDisabled("08:00", { minTime: "09:00" })).toBe(true)
    expect(timeDisabled("18:00", { maxTime: "17:00" })).toBe(true)
    expect(timeDisabled("12:00", { minTime: "09:00", maxTime: "17:00" })).toBe(false)
    expect(timeDisabled("12:00:30", { disableTime: ["12:00:00"] })).toBe(true)
    expect(timeDisabled("12:00:30", { disableTime: ["12:00:00"], withSeconds: true })).toBe(false)
    expect(timeDisabled("13:00", { disableTime: (time) => time.startsWith("13") })).toBe(true)
    expect(timeDisabled("13:00", {})).toBe(false)
  })

  it("picks a time, deselecting it only when allowed", () => {
    expect(gridPick(null, "10:00", {})).toEqual(Option.some("10:00"))
    expect(gridPick("10:00", "10:00", {})).toEqual(Option.none())
    expect(gridPick("10:00", "10:00", { allowDeselect: true })).toEqual(Option.some(null))
    expect(gridPick("10:00", "11:00", { allowDeselect: true })).toEqual(Option.some("11:00"))
    expect(gridPick("10:00:15", "10:00:30", { allowDeselect: true, withSeconds: true })).toEqual(
      Option.some("10:00:30")
    )
  })
})
