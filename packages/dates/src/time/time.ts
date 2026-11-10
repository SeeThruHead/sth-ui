import { Option } from "effect"

export type TimeParts = { readonly hours: number; readonly minutes: number; readonly seconds: number }

export const timeParts = (value: string): TimeParts => {
  const parts = value.split(":")
  const part = (index: number) => Number(parts[index]) || 0

  return { hours: part(0), minutes: part(1), seconds: part(2) }
}

const order = (a: TimeParts, b: TimeParts, withSeconds: boolean): number => {
  if (a.hours !== b.hours) return a.hours - b.hours
  if (a.minutes !== b.minutes) return a.minutes - b.minutes

  return withSeconds ? a.seconds - b.seconds : 0
}

export type TimeLimits = { readonly minTime?: string; readonly maxTime?: string; readonly withSeconds?: boolean }

export const limitExceeded = (value: string, limits: TimeLimits): -1 | 0 | 1 => {
  const time = timeParts(value)
  const withSeconds = limits.withSeconds === true
  if (limits.minTime !== undefined && order(time, timeParts(limits.minTime), withSeconds) < 0) return -1
  if (limits.maxTime !== undefined && order(time, timeParts(limits.maxTime), withSeconds) > 0) return 1

  return 0
}

export const clampTime = (value: string, limits: TimeLimits): Option.Option<string> => {
  if (value === "") return Option.none()
  const exceeded = limitExceeded(value, limits)
  if (exceeded === -1) return Option.fromNullishOr(limits.minTime)

  return exceeded === 1 ? Option.fromNullishOr(limits.maxTime) : Option.none()
}
