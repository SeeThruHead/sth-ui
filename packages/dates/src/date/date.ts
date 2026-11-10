import { Array as Arr, Option } from "effect"

export type DateString = string

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CivilDate = { readonly year: number; readonly month: number; readonly day: number }

const pad = (value: number, width = 2) => String(Math.abs(value)).padStart(width, "0")

const isoPattern = /^(-?\d{1,6})-(\d{1,2})-(\d{1,2})/

export const parseDate = (value: string): Option.Option<CivilDate> =>
  Option.flatMap(Option.fromNullishOr(isoPattern.exec(value.trim())), (match) => {
    const civil = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }

    return Option.liftPredicate(civil, isValid)
  })

export const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

const isValid = (civil: CivilDate) => {
  if (civil.month < 1 || civil.month > 12) return false

  return civil.day >= 1 && civil.day <= daysInMonth(civil.year, civil.month)
}

export const toIso = (civil: CivilDate): DateString =>
  `${civil.year < 0 ? "-" : ""}${pad(civil.year, 4)}-${pad(civil.month)}-${pad(civil.day)}`

const civilOf = (value: DateString): CivilDate =>
  Option.getOrElse(parseDate(value), () => ({ year: 1970, month: 1, day: 1 }))

export const daysFromCivil = ({ year, month, day }: CivilDate): number => {
  const y = month <= 2 ? year - 1 : year
  const era = Math.floor(y / 400)
  const yearOfEra = y - era * 400
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear

  return era * 146_097 + dayOfEra - 719_468
}

export const civilFromDays = (days: number): CivilDate => {
  const z = days + 719_468
  const era = Math.floor(z / 146_097)
  const dayOfEra = z - era * 146_097
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36_524) - Math.floor(dayOfEra / 146_096)) / 365
  )
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100))
  const shifted = Math.floor((5 * dayOfYear + 2) / 153)
  const day = dayOfYear - Math.floor((153 * shifted + 2) / 5) + 1
  const month = shifted + (shifted < 10 ? 3 : -9)

  return { year: yearOfEra + era * 400 + (month <= 2 ? 1 : 0), month, day }
}

export const dayNumber = (value: DateString): number => daysFromCivil(civilOf(value))

export const fromDayNumber = (days: number): DateString => toIso(civilFromDays(days))

export const normalize = (value: DateString): DateString => toIso(civilOf(value))

export const addDays = (value: DateString, days: number): DateString => fromDayNumber(dayNumber(value) + days)

export const addMonths = (value: DateString, months: number): DateString => {
  const civil = civilOf(value)
  const index = civil.year * 12 + (civil.month - 1) + months
  const year = Math.floor(index / 12)
  const month = index - year * 12 + 1

  return toIso({ year, month, day: Math.min(civil.day, daysInMonth(year, month)) })
}

export const addYears = (value: DateString, years: number): DateString => addMonths(value, years * 12)

const weekdays: ReadonlyArray<DayOfWeek> = [0, 1, 2, 3, 4, 5, 6]

export const dayOfWeek = (value: DateString): DayOfWeek => {
  const weekday = (((dayNumber(value) + 4) % 7) + 7) % 7

  return Arr.getUnsafe(weekdays, weekday)
}

export const startOfMonth = (value: DateString): DateString => toIso({ ...civilOf(value), day: 1 })

export const endOfMonth = (value: DateString): DateString => {
  const civil = civilOf(value)

  return toIso({ ...civil, day: daysInMonth(civil.year, civil.month) })
}

export const startOfYear = (value: DateString): DateString => toIso({ year: civilOf(value).year, month: 1, day: 1 })

export const startOfWeek = (value: DateString, firstDayOfWeek: DayOfWeek = 1): DateString =>
  addDays(value, -((dayOfWeek(value) - firstDayOfWeek + 7) % 7))

export const endOfWeek = (value: DateString, firstDayOfWeek: DayOfWeek = 1): DateString =>
  addDays(startOfWeek(value, firstDayOfWeek), 6)

const week = (start: DateString): ReadonlyArray<DateString> =>
  Array.from({ length: 7 }, (_day, index) => addDays(start, index))

export const monthDays = (input: {
  readonly month: DateString
  readonly firstDayOfWeek?: DayOfWeek
  readonly consistentWeeks?: boolean
}): ReadonlyArray<ReadonlyArray<DateString>> => {
  const first = startOfWeek(startOfMonth(input.month), input.firstDayOfWeek ?? 1)
  const last = endOfWeek(endOfMonth(input.month), input.firstDayOfWeek ?? 1)
  const weeks = (dayNumber(last) - dayNumber(first) + 1) / 7
  const count = input.consistentWeeks === true ? 6 : weeks

  return Array.from({ length: count }, (_week, index) => week(addDays(first, index * 7)))
}

export const compare = (a: DateString, b: DateString): number => dayNumber(a) - dayNumber(b)

export const isSameDay = (a: DateString, b: DateString) => compare(a, b) === 0

export const isSameMonth = (a: DateString, b: DateString) => startOfMonth(a) === startOfMonth(b)

export const isSameYear = (a: DateString, b: DateString) => civilOf(a).year === civilOf(b).year

export const isAfterMinDate = (value: DateString, minDate: DateString | undefined) =>
  minDate === undefined || compare(value, minDate) >= 0

export const isBeforeMaxDate = (value: DateString, maxDate: DateString | undefined) =>
  maxDate === undefined || compare(value, maxDate) <= 0

export const isInRange = (value: DateString, minDate: DateString | undefined, maxDate: DateString | undefined) =>
  isAfterMinDate(value, minDate) && isBeforeMaxDate(value, maxDate)

export const clampDate = (value: DateString, minDate: DateString | undefined, maxDate: DateString | undefined) => {
  const low = Option.filter(Option.fromNullishOr(minDate), (min) => compare(value, min) < 0)
  const high = Option.filter(Option.fromNullishOr(maxDate), (max) => compare(value, max) > 0)

  return normalize(
    Option.getOrElse(
      Option.orElse(low, () => high),
      () => value
    )
  )
}

export const isMonthDisabled = (
  month: DateString,
  minDate: DateString | undefined,
  maxDate: DateString | undefined
) => {
  if (minDate !== undefined && compare(startOfMonth(month), startOfMonth(minDate)) < 0) return true

  return maxDate !== undefined && compare(startOfMonth(month), startOfMonth(maxDate)) > 0
}

export const isYearDisabled = (year: DateString, minDate: DateString | undefined, maxDate: DateString | undefined) => {
  if (minDate !== undefined && civilOf(year).year < civilOf(minDate).year) return true

  return maxDate !== undefined && civilOf(year).year > civilOf(maxDate).year
}

export const isoWeekNumber = (value: DateString): number => {
  const thursday = addDays(value, 3 - ((dayOfWeek(value) + 6) % 7))
  const january = toIso({ year: civilOf(thursday).year, month: 1, day: 1 })

  return Math.floor(compare(thursday, january) / 7) + 1
}

export const weekNumber = (days: ReadonlyArray<DateString>): number => {
  const first = Arr.getUnsafe(days, 0)

  return isoWeekNumber(addDays(first, (8 - dayOfWeek(first)) % 7))
}

export const monthsData = (year: DateString): ReadonlyArray<ReadonlyArray<DateString>> => {
  const start = startOfYear(year)

  return Array.from({ length: 4 }, (_row, row) =>
    Array.from({ length: 3 }, (_cell, cell) => addMonths(start, row * 3 + cell))
  )
}

export const yearsData = (decade: DateString): ReadonlyArray<ReadonlyArray<DateString>> => {
  const first = civilOf(decade).year - (((civilOf(decade).year % 10) + 10) % 10)
  const yearAt = (offset: number) => toIso({ year: first + offset, month: 1, day: 1 })

  return [0, 3, 6, 9].map((offset) =>
    Array.from({ length: offset === 9 ? 1 : 3 }, (_cell, cell) => yearAt(offset + cell))
  )
}

export const decadeRange = (decade: DateString): readonly [DateString, DateString] => {
  const years = yearsData(decade).flat()

  return [Arr.getUnsafe(years, 0), Arr.getUnsafe(years, years.length - 1)]
}

const epochMillis = (value: DateString) => dayNumber(value) * 86_400_000

const formatter = (locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" })

const names = (locale: string, value: DateString) => ({
  MMMM: formatter(locale, { month: "long" }).format(epochMillis(value)),
  MMM: formatter(locale, { month: "short" }).format(epochMillis(value)),
  dddd: formatter(locale, { weekday: "long" }).format(epochMillis(value)),
  ddd: formatter(locale, { weekday: "short" }).format(epochMillis(value)),
  dd: formatter(locale, { weekday: "short" }).format(epochMillis(value)).slice(0, 2)
})

const tokens = /\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|d/g

export const formatDate = (value: DateString, format: string, locale = "en"): string => {
  const civil = civilOf(value)
  const named = names(locale, value)
  const parts: Readonly<Record<string, string>> = {
    YYYY: pad(civil.year, 4),
    YY: pad(civil.year % 100),
    MMMM: named.MMMM,
    MMM: named.MMM,
    MM: pad(civil.month),
    M: String(civil.month),
    DD: pad(civil.day),
    D: String(civil.day),
    dddd: named.dddd,
    ddd: named.ddd,
    dd: named.dd,
    d: String(dayOfWeek(value))
  }

  return format.replace(tokens, (token: string, escaped: string | undefined) => escaped ?? String(parts[token]))
}

export const weekdayNames = (locale: string, firstDayOfWeek: DayOfWeek = 1, format = "dd"): ReadonlyArray<string> =>
  week(startOfWeek("2024-01-01", firstDayOfWeek)).map((day) => formatDate(day, format, locale))
