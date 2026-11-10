import { Option, Schema } from "effect"
import { compare, isSameDay, isSameMonth, isSameYear, normalize } from "../date/date.ts"
import type { DateString } from "../date/date.ts"

export const PickerType = Schema.Literals(["default", "multiple", "range"])
export type PickerType = typeof PickerType.Type

export const PickerLevel = Schema.Literals(["day", "month", "year"])
export type PickerLevel = typeof PickerLevel.Type

export const Selection = Schema.Struct({
  type: PickerType,
  value: Schema.Array(Schema.String),
  hovered: Schema.Option(Schema.String)
})
export type Selection = typeof Selection.Type

export type SelectOptions = {
  readonly level?: PickerLevel
  readonly allowDeselect?: boolean
  readonly allowSingleDateInRange?: boolean
}

export type ControlState = {
  readonly selected: boolean
  readonly inRange: boolean
  readonly firstInRange: boolean
  readonly lastInRange: boolean
}

const sameAt: Readonly<Record<PickerLevel, (a: DateString, b: DateString) => boolean>> = {
  day: isSameDay,
  month: isSameMonth,
  year: isSameYear
}

export const selection = (type: PickerType, value: ReadonlyArray<DateString> = []): Selection => ({
  type,
  value: value.map(normalize),
  hovered: Option.none()
})

const same = (options: SelectOptions) => sameAt[options.level ?? "day"]

const pending = (current: Selection) =>
  current.value.length === 1 ? Option.fromNullishOr(current.value[0]) : Option.none()

const pickRange = (current: Selection, date: DateString, options: SelectOptions): Selection =>
  Option.match(pending(current), {
    onNone: () => ({ ...current, value: [date], hovered: Option.none() }),
    onSome: (start) => {
      if (same(options)(date, start) && options.allowSingleDateInRange !== true) return selection("range")

      return { ...current, value: [date, start].toSorted(compare), hovered: Option.none() }
    }
  })

const pickMultiple = (current: Selection, date: DateString, options: SelectOptions): Selection =>
  current.value.some((selected) => same(options)(selected, date))
    ? { ...current, value: current.value.filter((selected) => !same(options)(selected, date)) }
    : { ...current, value: [...current.value, date] }

const pickDefault = (current: Selection, date: DateString, options: SelectOptions): Selection => {
  const deselect = options.allowDeselect === true && current.value.some((selected) => same(options)(selected, date))

  return { ...current, value: deselect ? [] : [date] }
}

export const pick = (current: Selection, value: DateString, options: SelectOptions = {}): Selection => {
  const date = normalize(value)
  if (current.type === "range") return pickRange(current, date, options)
  if (current.type === "multiple") return pickMultiple(current, date, options)

  return pickDefault(current, date, options)
}

export const hover = (current: Selection, date: DateString): Selection =>
  current.type === "range" && Option.isSome(pending(current))
    ? { ...current, hovered: Option.some(normalize(date)) }
    : current

export const leave = (current: Selection): Selection => ({ ...current, hovered: Option.none() })

const between = (date: DateString, a: DateString, b: DateString) => {
  const ascending = compare(a, b) <= 0
  const low = ascending ? a : b
  const high = ascending ? b : a

  return compare(date, low) >= 0 && compare(date, high) <= 0
}

const rangeOf = (current: Selection): Option.Option<readonly [DateString, DateString]> => {
  const [first, second] = current.value
  if (first === undefined) return Option.none()
  if (second !== undefined) return Option.some([first, second])

  return Option.map(current.hovered, (hovered) => [hovered, first] as const)
}

const before = (a: DateString, b: DateString) => compare(a, b) < 0

export const controlState = (current: Selection, date: DateString, options: SelectOptions = {}): ControlState => {
  const isSame = same(options)
  const selected = current.value.some((value) => isSame(value, date))
  if (current.type !== "range") return { selected, inRange: false, firstInRange: false, lastInRange: false }
  const [first, second] = current.value
  const hoveredBefore = (start: DateString) => Option.exists(current.hovered, (hovered) => before(hovered, start))

  return {
    selected,
    inRange: Option.exists(rangeOf(current), ([a, b]) => between(date, a, b)),
    firstInRange: first !== undefined && isSame(date, first) && !hoveredBefore(first),
    lastInRange:
      second !== undefined ? isSame(date, second) : first !== undefined && hoveredBefore(first) && isSame(date, first)
  }
}

export const selectedValue = (current: Selection): ReadonlyArray<DateString> => current.value
