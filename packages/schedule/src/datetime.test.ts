import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import {
  addMinutes,
  compareDateTime,
  dateOf,
  fromSeconds,
  fromUtcDate,
  isValidDateTime,
  minutesBetween,
  minutesOfDay,
  normalizeDateTime,
  overlapsRange,
  timeOf,
  toSeconds,
  toUtcDate
} from "./datetime.ts"

describe("schedule date-times", () => {
  it("parses dates with or without times", () => {
    expect(toSeconds("1970-01-02")).toEqual(Option.some(86_400))
    expect(toSeconds("1970-01-01T01:02:03")).toEqual(Option.some(3723))
    expect(toSeconds("1970-01-01 01:02")).toEqual(Option.some(3720))
    expect(toSeconds("nope")).toEqual(Option.none())
    expect(toSeconds("2026-13-40")).toEqual(Option.none())
    expect(isValidDateTime("2026-02-16 09:00:00")).toBe(true)
  })

  it("formats, compares and moves date-times", () => {
    expect(fromSeconds(3723)).toBe("1970-01-01 01:02:03")
    expect(normalizeDateTime("2026-02-16T09:05")).toBe("2026-02-16 09:05:00")
    expect(compareDateTime("2026-02-16 09:00", "2026-02-16 10:00")).toBeLessThan(0)
    expect(addMinutes("2026-02-16 23:30:00", 45)).toBe("2026-02-17 00:15:00")
    expect(minutesBetween("2026-02-16 09:00", "2026-02-16 10:30")).toBe(90)
    expect(dateOf("2026-02-16 23:59:59")).toBe("2026-02-16")
    expect(timeOf("2026-02-16 09:05")).toBe("09:05:00")
    expect(minutesOfDay("2026-02-16 09:05")).toBe(545)
    expect(fromUtcDate(toUtcDate("2026-02-16 09:05:00"))).toBe("2026-02-16 09:05:00")
    expect(normalizeDateTime("bad")).toBe("1970-01-01 00:00:00")
  })

  it("checks ranges inclusively", () => {
    expect(overlapsRange("2026-02-16 09:00", "2026-02-16 10:00", "2026-02-16 10:00", "2026-02-16 11:00")).toBe(true)
    expect(overlapsRange("2026-02-16 09:00", "2026-02-16 09:59", "2026-02-16 10:00", "2026-02-16 11:00")).toBe(false)
    expect(overlapsRange("2026-02-16 12:00", "2026-02-16 13:00", "2026-02-16 10:00", "2026-02-16 11:00")).toBe(false)
  })
})
