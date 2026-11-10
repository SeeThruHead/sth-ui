import { Option } from "effect"
import { normalize } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import { padTime, splitTime } from "./clock.ts"

export type DateTimeString = string

export const datePart = (value: DateTimeString): DateString => normalize(value.slice(0, 10))

export const timePart = (value: DateTimeString): string => {
  const time = splitTime(value.slice(11))

  return `${padTime(time.hours ?? 0)}:${padTime(time.minutes ?? 0)}:${padTime(time.seconds ?? 0)}`
}

export const toDateTime = (date: DateString, time = "00:00:00"): DateTimeString => {
  const parts = splitTime(time)

  return `${normalize(date)} ${padTime(parts.hours ?? 0)}:${padTime(parts.minutes ?? 0)}:${padTime(parts.seconds ?? 0)}`
}

export const assignTime = (value: DateTimeString, time: string): DateTimeString =>
  toDateTime(datePart(value), time === "" ? timePart(value) : time)

const later = (a: DateTimeString, b: DateTimeString) =>
  toDateTime(datePart(a), timePart(a)) > toDateTime(datePart(b), timePart(b))

export const clampDateTime = (
  value: DateTimeString,
  minDate: DateTimeString | undefined,
  maxDate: DateTimeString | undefined
): DateTimeString => {
  const normal = toDateTime(datePart(value), timePart(value))
  if (minDate !== undefined && later(minDate, normal)) return toDateTime(datePart(minDate), timePart(minDate))
  if (maxDate !== undefined && later(normal, maxDate)) return toDateTime(datePart(maxDate), timePart(maxDate))

  return normal
}

export const timeLimitOn = (
  limit: DateTimeString | undefined,
  value: Option.Option<DateTimeString>
): string | undefined =>
  Option.match(value, {
    onNone: () => undefined,
    onSome: (current) => (limit !== undefined && datePart(limit) === datePart(current) ? timePart(limit) : undefined)
  })
