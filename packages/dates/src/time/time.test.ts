import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { clampTime, limitExceeded, timeParts } from "./time.ts"

describe("time limits, as Mantine's TimeInput", () => {
  it("reads hours, minutes and seconds", () => {
    expect(timeParts("09:05:30")).toEqual({ hours: 9, minutes: 5, seconds: 30 })
    expect(timeParts("09:05")).toEqual({ hours: 9, minutes: 5, seconds: 0 })
    expect(timeParts("x")).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })

  it("compares against the limits, seconds only when shown", () => {
    expect(limitExceeded("08:59", { minTime: "09:00" })).toBe(-1)
    expect(limitExceeded("09:00:10", { minTime: "09:00:30" })).toBe(0)
    expect(limitExceeded("09:00:10", { minTime: "09:00:30", withSeconds: true })).toBe(-1)
    expect(limitExceeded("17:01", { maxTime: "17:00" })).toBe(1)
    expect(limitExceeded("18:00", { minTime: "09:00", maxTime: "17:00" })).toBe(1)
    expect(limitExceeded("12:00", { minTime: "09:00", maxTime: "17:00" })).toBe(0)
    expect(limitExceeded("12:00", {})).toBe(0)
  })

  it("clamps a time outside the limits to the nearest one", () => {
    expect(clampTime("08:00", { minTime: "09:00", maxTime: "17:00" })).toEqual(Option.some("09:00"))
    expect(clampTime("20:00", { minTime: "09:00", maxTime: "17:00" })).toEqual(Option.some("17:00"))
    expect(clampTime("10:00", { minTime: "09:00", maxTime: "17:00" })).toEqual(Option.none())
    expect(clampTime("", { minTime: "09:00" })).toEqual(Option.none())
  })
})
