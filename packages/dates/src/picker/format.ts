import { formatDate } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import type { PickerType } from "./selection.ts"

export type FormatterInput = {
  readonly type: PickerType
  readonly value: ReadonlyArray<DateString>
  readonly locale: string
  readonly format: string
  readonly labelSeparator: string
}

export type DateFormatter = (input: FormatterInput) => string

export const defaultDateFormatter: DateFormatter = ({ type, value, locale, format, labelSeparator }) => {
  const formatted = value.map((date) => formatDate(date, format, locale))
  if (type !== "range") return formatted.join(", ")
  const [start, end] = formatted
  if (start === undefined) return ""

  return `${start} ${labelSeparator} ${end ?? ""}`
}

export const hiddenValue = (type: PickerType, value: ReadonlyArray<DateString>): string => {
  if (type !== "range") return value.join(", ")
  const [start, end] = value
  if (start === undefined) return ""

  return end === undefined ? `${start} –` : `${start} – ${end}`
}
