import { Option } from "effect"
import { isSameTime, timeToSeconds } from "./clock.ts"

export type DisableTime = ReadonlyArray<string> | ((time: string) => boolean)

export type GridLimits = {
  readonly disabled?: boolean
  readonly minTime?: string
  readonly maxTime?: string
  readonly disableTime?: DisableTime
  readonly withSeconds?: boolean
}

export const isTimeBefore = (value: string, compareTo: string): boolean =>
  timeToSeconds(value) < timeToSeconds(compareTo)

export const isTimeAfter = (value: string, compareTo: string): boolean =>
  timeToSeconds(value) > timeToSeconds(compareTo)

const listed = (time: string, disableTime: DisableTime, withSeconds: boolean) =>
  typeof disableTime === "function"
    ? disableTime(time)
    : disableTime.some((item) => isSameTime(time, item, withSeconds))

export const timeDisabled = (time: string, limits: GridLimits): boolean => {
  if (limits.disabled === true) return true
  if (limits.minTime !== undefined && isTimeBefore(time, limits.minTime)) return true
  if (limits.maxTime !== undefined && isTimeAfter(time, limits.maxTime)) return true

  return limits.disableTime !== undefined && listed(time, limits.disableTime, limits.withSeconds === true)
}

export const gridPick = (
  current: string | null,
  time: string,
  options: { readonly allowDeselect?: boolean; readonly withSeconds?: boolean }
): Option.Option<string | null> => {
  const same = current !== null && isSameTime(time, current, options.withSeconds === true)
  const next = options.allowDeselect === true && same ? null : time

  return next === current ? Option.none() : Option.some(next)
}
