import { addMonths, addYears, compare, decadeRange, endOfMonth, startOfMonth, startOfYear } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import type { CalendarLevel } from "./model.ts"

export const columnDate = (level: CalendarLevel, date: DateString, column: number): DateString => {
  if (level === "month") return addMonths(date, column)

  return addYears(date, level === "year" ? column : column * 10)
}

const firstDayOf = (level: CalendarLevel, date: DateString) => {
  if (level === "month") return startOfMonth(date)
  if (level === "year") return startOfYear(date)

  return decadeRange(date)[0]
}

const lastDayOf = (level: CalendarLevel, date: DateString) => {
  if (level === "month") return endOfMonth(date)
  if (level === "year") return endOfMonth(addMonths(startOfYear(date), 11))

  return endOfMonth(addMonths(decadeRange(date)[1], 11))
}

export const previousDisabled = (level: CalendarLevel, date: DateString, minDate: DateString | undefined) =>
  minDate !== undefined && compare(firstDayOf(level, date), minDate) <= 0

export const nextDisabled = (level: CalendarLevel, date: DateString, maxDate: DateString | undefined) =>
  maxDate !== undefined && compare(lastDayOf(level, date), maxDate) >= 0
