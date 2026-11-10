import { describe, expect, it } from "@effect/vitest"
import { columnDate, nextDisabled, previousDisabled } from "./levels.ts"

describe("calendar level limits, as Mantine's levels", () => {
  it("places each column a month, year or decade apart", () => {
    expect(columnDate("month", "2024-11-01", 2)).toBe("2025-01-01")
    expect(columnDate("year", "2024-11-01", 2)).toBe("2026-11-01")
    expect(columnDate("decade", "2024-11-01", 1)).toBe("2034-11-01")
  })

  it("disables previous when the level starts on or before the min date", () => {
    expect(previousDisabled("month", "2024-05-01", "2024-05-01")).toBe(true)
    expect(previousDisabled("month", "2024-05-01", "2024-04-30")).toBe(false)
    expect(previousDisabled("year", "2024-05-01", "2024-03-01")).toBe(true)
    expect(previousDisabled("decade", "2024-05-01", "2019-12-31")).toBe(false)
    expect(previousDisabled("decade", "2024-05-01", "2020-01-01")).toBe(true)
    expect(previousDisabled("month", "2024-05-01", undefined)).toBe(false)
  })

  it("disables next when the level ends on or after the max date", () => {
    expect(nextDisabled("month", "2024-05-01", "2024-05-31")).toBe(true)
    expect(nextDisabled("month", "2024-05-01", "2024-06-01")).toBe(false)
    expect(nextDisabled("year", "2024-05-01", "2024-12-31")).toBe(true)
    expect(nextDisabled("year", "2024-05-01", "2025-01-01")).toBe(false)
    expect(nextDisabled("decade", "2024-05-01", "2029-06-01")).toBe(true)
    expect(nextDisabled("decade", "2024-05-01", undefined)).toBe(false)
  })
})
