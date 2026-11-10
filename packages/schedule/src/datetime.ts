import { DateTime, Option } from "effect"
import { dayNumber, fromDayNumber, parseDate } from "@sth-ui/dates/date/date.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"

export type DateTimeString = string

const pattern = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/

const pad = (value: number) => String(value).padStart(2, "0")

export const toSeconds = (value: DateTimeString): Option.Option<number> => {
  const match = pattern.exec(value.trim())
  if (match === null) return Option.none()
  const [date, hours, minutes, seconds] = match.slice(1, 5).map((part) => part ?? "0")

  return Option.map(
    parseDate(String(date)),
    () => dayNumber(String(date)) * 86_400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  )
}

export const isValidDateTime = (value: DateTimeString): boolean => Option.isSome(toSeconds(value))

export const fromSeconds = (seconds: number): DateTimeString => {
  const days = Math.floor(seconds / 86_400)
  const rest = seconds - days * 86_400

  return `${fromDayNumber(days)} ${pad(Math.floor(rest / 3600))}:${pad(Math.floor((rest % 3600) / 60))}:${pad(rest % 60)}`
}

export const secondsOf = (value: DateTimeString): number => Option.getOrElse(toSeconds(value), () => 0)

export const normalizeDateTime = (value: DateTimeString): DateTimeString => fromSeconds(secondsOf(value))

export const compareDateTime = (a: DateTimeString, b: DateTimeString): number => secondsOf(a) - secondsOf(b)

export const addMinutes = (value: DateTimeString, minutes: number): DateTimeString =>
  fromSeconds(secondsOf(value) + minutes * 60)

export const minutesBetween = (start: DateTimeString, end: DateTimeString): number =>
  (secondsOf(end) - secondsOf(start)) / 60

export const dateOf = (value: DateTimeString): DateString => fromSeconds(secondsOf(value)).slice(0, 10)

export const timeOf = (value: DateTimeString): string => fromSeconds(secondsOf(value)).slice(11)

export const minutesOfDay = (value: DateTimeString): number => {
  const seconds = secondsOf(value)

  return (seconds - Math.floor(seconds / 86_400) * 86_400) / 60
}

export const toUtcDate = (value: DateTimeString): Date => utcDate(secondsOf(value) * 1000)

export const utcDate = (millis: number): Date => DateTime.toDateUtc(DateTime.makeUnsafe(millis))

export const fromUtcDate = (date: Date): DateTimeString => fromSeconds(Math.floor(date.getTime() / 1000))

export const overlapsRange = (
  start: DateTimeString,
  end: DateTimeString,
  rangeStart: DateTimeString,
  rangeEnd: DateTimeString
) => compareDateTime(end, rangeStart) >= 0 && compareDateTime(start, rangeEnd) <= 0
