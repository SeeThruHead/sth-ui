import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  civilFromDays,
  compare,
  dayNumber,
  dayOfWeek,
  daysFromCivil,
  daysInMonth,
  decadeRange,
  endOfMonth,
  endOfWeek,
  formatDate,
  fromDayNumber,
  isAfterMinDate,
  isBeforeMaxDate,
  isInRange,
  isMonthDisabled,
  isoWeekNumber,
  isSameDay,
  isSameMonth,
  isSameYear,
  isYearDisabled,
  monthDays,
  monthsData,
  normalize,
  parseDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toIso,
  weekdayNames,
  weekNumber,
  yearsData
} from "./date.ts"

const days = Schema.Int.check(Schema.isBetween({ minimum: -800_000, maximum: 800_000 }))

const firstDay = Schema.Literals([0, 1, 2, 3, 4, 5, 6])

describe("calendar dates", () => {
  it("parses and prints YYYY-MM-DD, rejecting impossible dates", () => {
    expect(parseDate("2024-02-29")).toEqual(Option.some({ year: 2024, month: 2, day: 29 }))
    expect(parseDate(" 2024-3-5 10:00 ")).toEqual(Option.some({ year: 2024, month: 3, day: 5 }))
    expect(parseDate("2023-02-29")).toEqual(Option.none())
    expect(parseDate("2023-13-01")).toEqual(Option.none())
    expect(parseDate("2023-00-01")).toEqual(Option.none())
    expect(parseDate("2023-04-31")).toEqual(Option.none())
    expect(parseDate("tomorrow")).toEqual(Option.none())
    expect(toIso({ year: 33, month: 1, day: 2 })).toBe("0033-01-02")
    expect(toIso({ year: -44, month: 3, day: 15 })).toBe("-0044-03-15")
    expect(normalize("nonsense")).toBe("1970-01-01")
  })

  it("knows month lengths and leap years", () => {
    expect([1, 2, 4, 6, 9, 11, 12].map((month) => daysInMonth(2023, month))).toEqual([31, 28, 30, 30, 30, 30, 31])
    expect([2024, 1900, 2000].map((year) => daysInMonth(year, 2))).toEqual([29, 28, 29])
  })

  it("counts days from 1970 and knows the weekday", () => {
    expect(dayNumber("1970-01-01")).toBe(0)
    expect(dayNumber("2000-03-01")).toBe(11_017)
    expect(fromDayNumber(-1)).toBe("1969-12-31")
    expect(dayOfWeek("1970-01-01")).toBe(4)
    expect(dayOfWeek("2024-01-01")).toBe(1)
    expect(dayOfWeek("1969-12-28")).toBe(0)
  })

  it.prop("turns day numbers into dates and back", [days], ([day]) => {
    expect(daysFromCivil(civilFromDays(day))).toBe(day)
    expect(dayNumber(fromDayNumber(day))).toBe(day)
  })

  it.prop(
    "adds days both ways and steps the weekday by one",
    [days, Schema.Int.check(Schema.isBetween({ minimum: -1000, maximum: 1000 }))],
    ([day, by]) => {
      const date = fromDayNumber(day)
      expect(addDays(addDays(date, by), -by)).toBe(date)
      expect(compare(addDays(date, by), date)).toBe(by)
      expect(dayOfWeek(addDays(date, 1))).toBe((dayOfWeek(date) + 1) % 7)
    }
  )

  it("adds months and years, keeping the day within the month", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29")
    expect(addMonths("2024-03-31", -13)).toBe("2023-02-28")
    expect(addMonths("2024-11-15", 2)).toBe("2025-01-15")
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28")
  })

  it("finds the edges of months, years and weeks", () => {
    expect(startOfMonth("2024-05-17")).toBe("2024-05-01")
    expect(endOfMonth("2024-02-03")).toBe("2024-02-29")
    expect(startOfYear("2024-05-17")).toBe("2024-01-01")
    expect(startOfWeek("2024-05-17")).toBe("2024-05-13")
    expect(startOfWeek("2024-05-17", 0)).toBe("2024-05-12")
    expect(endOfWeek("2024-05-17")).toBe("2024-05-19")
    expect(endOfWeek("2024-05-17", 6)).toBe("2024-05-17")
  })

  it("lays out a month in weeks, as Mantine's getMonthDays does", () => {
    const may = monthDays({ month: "2024-05-01" })
    expect(may).toHaveLength(5)
    expect(may[0]?.[0]).toBe("2024-04-29")
    expect(may.at(-1)?.at(-1)).toBe("2024-06-02")
    expect(monthDays({ month: "2026-02-10", firstDayOfWeek: 0 })).toHaveLength(4)
    expect(monthDays({ month: "2026-02-10", firstDayOfWeek: 0, consistentWeeks: true })).toHaveLength(6)
  })

  it.prop("covers every day of the month in whole weeks from the first weekday", [days, firstDay], ([day, first]) => {
    const month = fromDayNumber(day)
    const weeks = monthDays({ month, firstDayOfWeek: first })
    const all = weeks.flat()
    expect(weeks.every((week) => week.length === 7 && dayOfWeek(week[0] ?? "") === first)).toBe(true)
    expect(all.filter((date) => isSameMonth(date, month))).toHaveLength(
      daysInMonth(Number(startOfMonth(month).slice(0, -6)), Number(startOfMonth(month).slice(-5, -3)))
    )
    expect(all.every((date, index) => index === 0 || compare(date, all[index - 1] ?? date) === 1)).toBe(true)
  })

  it("compares dates and limits them to a range", () => {
    expect(isSameDay("2024-05-01", "2024-5-1")).toBe(true)
    expect(isSameMonth("2024-05-01", "2024-05-31")).toBe(true)
    expect(isSameYear("2024-01-01", "2024-12-31")).toBe(true)
    expect(isAfterMinDate("2024-05-01", undefined)).toBe(true)
    expect(isAfterMinDate("2024-05-01", "2024-05-01")).toBe(true)
    expect(isAfterMinDate("2024-04-30", "2024-05-01")).toBe(false)
    expect(isBeforeMaxDate("2024-05-02", "2024-05-01")).toBe(false)
    expect(isBeforeMaxDate("2024-05-02", undefined)).toBe(true)
    expect(isInRange("2024-05-02", "2024-05-01", "2024-05-03")).toBe(true)
    expect(clampDate("2024-04-01", "2024-05-01", "2024-06-01")).toBe("2024-05-01")
    expect(clampDate("2024-07-01", "2024-05-01", "2024-06-01")).toBe("2024-06-01")
    expect(clampDate("2024-5-9", undefined, undefined)).toBe("2024-05-09")
  })

  it("disables months and years outside the range", () => {
    expect(isMonthDisabled("2024-04-01", "2024-05-20", undefined)).toBe(true)
    expect(isMonthDisabled("2024-05-01", "2024-05-20", "2024-06-01")).toBe(false)
    expect(isMonthDisabled("2024-07-01", undefined, "2024-06-30")).toBe(true)
    expect(isMonthDisabled("2024-07-01", undefined, undefined)).toBe(false)
    expect(isYearDisabled("2023-01-01", "2024-05-20", undefined)).toBe(true)
    expect(isYearDisabled("2025-01-01", undefined, "2024-05-20")).toBe(true)
    expect(isYearDisabled("2024-01-01", "2024-05-20", "2024-05-21")).toBe(false)
  })

  it("numbers ISO weeks", () => {
    expect(isoWeekNumber("2021-01-03")).toBe(53)
    expect(isoWeekNumber("2021-01-04")).toBe(1)
    expect(isoWeekNumber("2024-12-30")).toBe(1)
    expect(
      weekNumber(["2024-05-12", "2024-05-13", "2024-05-14", "2024-05-15", "2024-05-16", "2024-05-17", "2024-05-18"])
    ).toBe(20)
    expect(weekNumber(["2024-05-13", "2024-05-14"])).toBe(20)
  })

  it("lists months and years as Mantine's pickers do", () => {
    expect(monthsData("2024-07-09").map((row) => row.map((month) => month.slice(5, 7)))).toEqual([
      ["01", "02", "03"],
      ["04", "05", "06"],
      ["07", "08", "09"],
      ["10", "11", "12"]
    ])
    expect(yearsData("2024-07-09").map((row) => row.map((year) => year.slice(0, 4)))).toEqual([
      ["2020", "2021", "2022"],
      ["2023", "2024", "2025"],
      ["2026", "2027", "2028"],
      ["2029"]
    ])
    expect(decadeRange("2024-07-09")).toEqual(["2020-01-01", "2029-01-01"])
  })

  it("formats with dayjs' tokens and the locale's names", () => {
    expect(formatDate("2024-05-07", "dddd, MMMM D, YYYY")).toBe("Tuesday, May 7, 2024")
    expect(formatDate("2024-05-07", "ddd DD/MM/YY M [day] d")).toBe("Tue 07/05/24 5 day 2")
    expect(formatDate("2024-05-07", "MMM", "fr")).toBe("mai")
    expect(formatDate("2024-05-07", "dd")).toBe("Tu")
    expect(weekdayNames("en")).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])
    expect(weekdayNames("en", 0, "ddd")).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
  })
})
