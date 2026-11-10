import { describe, expect, it } from "@effect/vitest"
import { DateTime } from "effect"
import {
  boundaries,
  firstMonthColumn,
  getColumns,
  getDatesRange,
  getMonthsRange,
  heatColor,
  rotateWeekdays,
  toUtcMidnight
} from "./calendar.ts"

const range = (startDate: string, endDate: string, withOutsideDates = true, firstDayOfWeek = 1) =>
  getDatesRange({ startDate, endDate, withOutsideDates, firstDayOfWeek })

describe("Heatmap helpers, as Mantine's tests", () => {
  it("lays dates out in weeks starting on the first day of the week", () => {
    const weeks = range("2024-02-07", "2024-02-20")
    expect(weeks[0]).toEqual([
      "2024-02-05",
      "2024-02-06",
      "2024-02-07",
      "2024-02-08",
      "2024-02-09",
      "2024-02-10",
      "2024-02-11"
    ])
    expect(weeks).toHaveLength(3)
    expect(range("2024-02-07", "2024-02-20", false)[0]?.slice(0, 3)).toEqual([null, null, "2024-02-07"])
    expect(range("2024-02-07", "2024-02-20", true, 0)[0]?.[0]).toBe("2024-02-04")
  })

  it("normalises dates to UTC midnight", () => {
    expect(DateTime.formatIso(toUtcMidnight("2024-02-07"))).toBe("2024-02-07T00:00:00.000Z")
    expect(DateTime.formatIso(toUtcMidnight("2024-02-07T15:00:00Z"))).toBe("2024-02-07T00:00:00.000Z")
    expect(DateTime.formatIso(toUtcMidnight(DateTime.makeUnsafe("2024-02-07T23:00:00Z")))).toBe(
      "2024-02-07T00:00:00.000Z"
    )
  })

  it("groups weeks by month", () => {
    expect(getMonthsRange(range("2025-01-27", "2025-03-02"))).toEqual([
      { month: 0, position: 0, size: 1 },
      { month: 1, position: 1, size: 4 }
    ])
    expect(getMonthsRange(range("2025-01-29", "2025-02-02", false))).toEqual([{ month: 1, position: 0, size: 1 }])
  })

  it("splits weeks at month boundaries with spacers", () => {
    const weeks = range("2025-01-27", "2025-03-02")
    expect(getColumns(weeks, false).map((column) => (column.type === "column" ? column.month : -1))).toEqual([
      0, 1, 1, 1, 1
    ])
    const split = getColumns(weeks, true)
    expect(split.map((column) => column.type)).toEqual([
      "column",
      "spacer",
      "column",
      "column",
      "column",
      "column",
      "column",
      "spacer",
      "column"
    ])
    expect([firstMonthColumn(split, 0), firstMonthColumn(split, 1), firstMonthColumn(split, 2)]).toEqual([0, 2, 8])
    expect(getColumns(range("2025-01-29", "2025-02-02", false), true).map((column) => column.type)).toEqual([
      "column",
      "spacer",
      "column"
    ])
  })

  it("picks a colour level and the domain", () => {
    const colors = ["a", "b", "c", "d"]
    expect(heatColor(0, 0, 10, colors)).toBe("a")
    expect(heatColor(10, 0, 10, colors)).toBe("d")
    expect(heatColor(20, 0, 10, colors)).toBe("d")
    expect(heatColor(5, 5, 5, colors)).toBe("d")
    expect(heatColor(1, 0, 1, [])).toBe("")
    expect(boundaries({ a: 3, b: 9 }, undefined)).toEqual([3, 9])
    expect(boundaries({ a: 3 }, [0, 20])).toEqual([0, 20])
    expect(rotateWeekdays(["Sun", "Mon", "Tue"], 1)).toEqual(["Mon", "Tue", "Sun"])
  })
})
