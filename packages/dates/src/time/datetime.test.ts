import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { assignTime, clampDateTime, datePart, timeLimitOn, timePart, toDateTime } from "./datetime.ts"

describe("date and time values, as Mantine's DateTimePicker helpers", () => {
  it("splits and joins a date and a time", () => {
    expect(datePart("2024-05-09 14:30:00")).toBe("2024-05-09")
    expect(timePart("2024-05-09 14:30")).toBe("14:30:00")
    expect(timePart("2024-05-09")).toBe("00:00:00")
    expect(toDateTime("2024-05-09")).toBe("2024-05-09 00:00:00")
    expect(toDateTime("2024-05-09", "7:5")).toBe("2024-05-09 07:05:00")
    expect(toDateTime("2024-05-09", "")).toBe("2024-05-09 00:00:00")
  })

  it("puts a time on a date, keeping the old time when none is given", () => {
    expect(assignTime("2024-05-09 10:00:00", "14:30")).toBe("2024-05-09 14:30:00")
    expect(assignTime("2024-05-09 10:00:00", "")).toBe("2024-05-09 10:00:00")
  })

  it("clamps between the limits, to the second", () => {
    expect(clampDateTime("2024-05-09 08:00:00", "2024-05-09 09:30:00", undefined)).toBe("2024-05-09 09:30:00")
    expect(clampDateTime("2024-05-10 08:00", undefined, "2024-05-09 18:00:00")).toBe("2024-05-09 18:00:00")
    expect(clampDateTime("2024-05-09 12:00", "2024-05-09 09:30:00", "2024-05-09 18:00:00")).toBe("2024-05-09 12:00:00")
  })

  it("gives the limit's time only on the limit's day, as getMinTime and getMaxTime", () => {
    expect(timeLimitOn("2022-04-11 00:30:00", Option.some("2022-04-11 18:00:00"))).toBe("00:30:00")
    expect(timeLimitOn("2022-04-11 00:30:00", Option.some("2022-04-12 00:00:00"))).toBeUndefined()
    expect(timeLimitOn(undefined, Option.some("2022-04-11 18:00:00"))).toBeUndefined()
    expect(timeLimitOn("2022-04-11 00:30:00", Option.none())).toBeUndefined()
  })
})
