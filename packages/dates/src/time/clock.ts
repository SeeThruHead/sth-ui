import { Option } from "effect"

export type TimeFormat = "12h" | "24h"

export type AmPmLabels = { readonly am: string; readonly pm: string }

export const defaultAmPmLabels: AmPmLabels = { am: "AM", pm: "PM" }

export type Fields = {
  readonly hours: number | null
  readonly minutes: number | null
  readonly seconds: number | null
  readonly amPm: string | null
}

export const emptyFields: Fields = { hours: null, minutes: null, seconds: null, amPm: null }

export const padTime = (value: number): string => (value < 10 ? `0${value}` : `${value}`)

const numberAt = (parts: ReadonlyArray<string>, index: number): number | null => {
  const part = parts[index]
  if (part === undefined || part.trim() === "") return null
  const value = Number(part)

  return Number.isFinite(value) ? value : null
}

export const splitTime = (value: string): Omit<Fields, "amPm"> => {
  const parts = value.split(":")

  return { hours: numberAt(parts, 0), minutes: numberAt(parts, 1), seconds: numberAt(parts, 2) }
}

export const to12Hour = (fields: Omit<Fields, "amPm">, labels: AmPmLabels): Fields => {
  if (fields.hours === null) return emptyFields

  return {
    hours: fields.hours % 12 === 0 ? 12 : fields.hours % 12,
    minutes: fields.minutes,
    seconds: fields.seconds,
    amPm: fields.hours >= 12 ? labels.pm : labels.am
  }
}

export const parseTime = (value: string, format: TimeFormat, labels: AmPmLabels = defaultAmPmLabels): Fields => {
  if (value === "") return emptyFields
  const fields = splitTime(value)

  return format === "12h" ? to12Hour(fields, labels) : { ...fields, amPm: null }
}

const to24Hour = (hours: number, amPm: string, labels: AmPmLabels): number => {
  if (amPm === labels.pm && hours !== 12) return hours + 12

  return amPm === labels.am && hours === 12 ? 0 : hours
}

export type TimeStringOptions = {
  readonly format: TimeFormat
  readonly withSeconds: boolean
  readonly amPmLabels?: AmPmLabels
}

export const timeString = (fields: Fields, options: TimeStringOptions): Option.Option<string> => {
  if (fields.hours === null || fields.minutes === null) return Option.none()
  if (options.withSeconds && fields.seconds === null) return Option.none()
  const seconds = options.withSeconds && fields.seconds !== null ? `:${padTime(fields.seconds)}` : ""
  if (options.format === "24h") return Option.some(`${padTime(fields.hours)}:${padTime(fields.minutes)}${seconds}`)
  if (fields.amPm === null) return Option.none()
  const hours = to24Hour(fields.hours, fields.amPm, options.amPmLabels ?? defaultAmPmLabels)

  return Option.some(`${padTime(hours)}:${padTime(fields.minutes)}${seconds}`)
}

export const formattedTime = (
  value: string,
  options: { readonly format?: TimeFormat; readonly withSeconds?: boolean; readonly amPmLabels?: AmPmLabels } = {}
): Option.Option<string> => {
  const fields = splitTime(value)
  if (fields.hours === null || fields.minutes === null) return Option.none()
  const seconds = options.withSeconds === true ? `:${padTime(fields.seconds ?? 0)}` : ""
  if (options.format !== "12h") return Option.some(`${padTime(fields.hours)}:${padTime(fields.minutes)}${seconds}`)
  const labels = options.amPmLabels ?? defaultAmPmLabels
  const hours = fields.hours % 12 === 0 ? 12 : fields.hours % 12

  return Option.some(`${hours}:${padTime(fields.minutes)}${seconds} ${fields.hours >= 12 ? labels.pm : labels.am}`)
}

export const timeToSeconds = (value: string): number => {
  const fields = splitTime(value)

  return (fields.hours ?? 0) * 3600 + (fields.minutes ?? 0) * 60 + (fields.seconds ?? 0)
}

export const secondsToTime = (total: number): string =>
  `${padTime(Math.floor(total / 3600))}:${padTime(Math.floor((total % 3600) / 60))}:${padTime(total % 60)}`

export const clampTimeString = (
  value: string,
  min: string | undefined,
  max: string | undefined,
  withSeconds: boolean
): string => {
  const low = min === undefined ? Number.NEGATIVE_INFINITY : timeToSeconds(min)
  const high = max === undefined ? Number.POSITIVE_INFINITY : timeToSeconds(max)
  const lowest = withSeconds ? low : Math.ceil(low / 60) * 60
  const highest = withSeconds ? high : Math.floor(high / 60) * 60
  const clamped = secondsToTime(Math.max(lowest, Math.min(timeToSeconds(value), highest)))

  return withSeconds ? clamped : clamped.slice(0, 5)
}

export const isSameTime = (time: string, compare: string, withSeconds: boolean): boolean => {
  const a = splitTime(time)
  const b = splitTime(compare)
  if (a.hours !== b.hours || a.minutes !== b.minutes) return false

  return !withSeconds || a.seconds === b.seconds
}

export const valuesRange = (min: number, max: number, step: number): ReadonlyArray<number> =>
  Array.from({ length: Math.max(Math.floor((max - min) / step) + 1, 0) }, (_value, index) => min + index * step)

export const timeRange = (startTime: string, endTime: string, interval: string): ReadonlyArray<string> => {
  const start = timeToSeconds(startTime)

  return valuesRange(start, timeToSeconds(endTime), timeToSeconds(interval)).map(secondsToTime)
}
