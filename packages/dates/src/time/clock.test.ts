import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import {
  clampTimeString,
  emptyFields,
  formattedTime,
  isSameTime,
  padTime,
  parseTime,
  secondsToTime,
  splitTime,
  timeRange,
  timeString,
  timeToSeconds,
  valuesRange
} from "./clock.ts"

describe("clock times, as Mantine's TimePicker utilities", () => {
  it("pads and splits", () => {
    expect(padTime(5)).toBe("05")
    expect(padTime(12)).toBe("12")
    expect(splitTime("09:05:30")).toEqual({ hours: 9, minutes: 5, seconds: 30 })
    expect(splitTime("09")).toEqual({ hours: 9, minutes: null, seconds: null })
    expect(splitTime("x: :1")).toEqual({ hours: null, minutes: null, seconds: 1 })
  })

  it("parses into 24 or 12 hour fields", () => {
    expect(parseTime("", "24h")).toEqual(emptyFields)
    expect(parseTime("14:05", "24h")).toEqual({ hours: 14, minutes: 5, seconds: null, amPm: null })
    expect(parseTime("14:05:09", "12h")).toEqual({ hours: 2, minutes: 5, seconds: 9, amPm: "PM" })
    expect(parseTime("00:30", "12h", { am: "am", pm: "pm" })).toEqual({
      hours: 12,
      minutes: 30,
      seconds: null,
      amPm: "am"
    })
    expect(parseTime("12:00", "12h").amPm).toBe("PM")
    expect(parseTime(":30", "12h")).toEqual(emptyFields)
  })

  it("builds the value only when every shown field is filled", () => {
    const full = { hours: 7, minutes: 5, seconds: 3, amPm: null }
    expect(timeString(full, { format: "24h", withSeconds: false })).toEqual(Option.some("07:05"))
    expect(timeString(full, { format: "24h", withSeconds: true })).toEqual(Option.some("07:05:03"))
    expect(timeString({ ...full, seconds: null }, { format: "24h", withSeconds: true })).toEqual(Option.none())
    expect(timeString({ ...full, minutes: null }, { format: "24h", withSeconds: false })).toEqual(Option.none())
    expect(timeString(full, { format: "12h", withSeconds: false })).toEqual(Option.none())
    expect(timeString({ ...full, amPm: "PM" }, { format: "12h", withSeconds: false })).toEqual(Option.some("19:05"))
    expect(timeString({ ...full, hours: 12, amPm: "PM" }, { format: "12h", withSeconds: false })).toEqual(
      Option.some("12:05")
    )
    expect(timeString({ ...full, hours: 12, amPm: "AM" }, { format: "12h", withSeconds: true })).toEqual(
      Option.some("00:05:03")
    )
    expect(timeString({ ...full, amPm: "AM" }, { format: "12h", withSeconds: false })).toEqual(Option.some("07:05"))
  })

  it("formats for display", () => {
    expect(formattedTime("14:05:09")).toEqual(Option.some("14:05"))
    expect(formattedTime("14:05", { withSeconds: true })).toEqual(Option.some("14:05:00"))
    expect(formattedTime("14:05:09", { format: "12h", withSeconds: true })).toEqual(Option.some("2:05:09 PM"))
    expect(formattedTime("00:05", { format: "12h", amPmLabels: { am: "a", pm: "p" } })).toEqual(Option.some("12:05 a"))
    expect(formattedTime("00:05", { format: "12h" })).toEqual(Option.some("12:05 AM"))
    expect(formattedTime("x")).toEqual(Option.none())
  })

  it("counts, clamps and compares seconds", () => {
    expect(timeToSeconds("01:02:03")).toBe(3723)
    expect(timeToSeconds("")).toBe(0)
    expect(secondsToTime(3723)).toBe("01:02:03")
    expect(clampTimeString("08:00:00", "09:00:00", "17:00:00", true)).toBe("09:00:00")
    expect(clampTimeString("18:00", "09:00:30", "17:59:30", false)).toBe("17:59")
    expect(clampTimeString("08:00", "09:00:30", undefined, false)).toBe("09:01")
    expect(clampTimeString("12:00:00", undefined, undefined, true)).toBe("12:00:00")
    expect(isSameTime("10:00:01", "10:00:02", false)).toBe(true)
    expect(isSameTime("10:00:01", "10:00:02", true)).toBe(false)
    expect(isSameTime("10:01", "10:00", false)).toBe(false)
  })

  it("lists values and time ranges", () => {
    expect(valuesRange(0, 10, 5)).toEqual([0, 5, 10])
    expect(valuesRange(1, 0, 1)).toEqual([])
    expect(timeRange("10:00", "11:00", "00:30")).toEqual(["10:00:00", "10:30:00", "11:00:00"])
  })
})
