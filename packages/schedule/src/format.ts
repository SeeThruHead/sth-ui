import { formatDate } from "@sth-ui/dates/date/date.ts"
import { timeSeconds } from "./dayLayout.ts"
import { dateOf, timeOf } from "./datetime.ts"
import type { DateTimeString } from "./datetime.ts"

export type DateLabelFormat = string | ((value: DateTimeString) => string)

const pad = (value: number) => String(value).padStart(2, "0")

const timeTokens = /\[([^\]]*)]|HH|H|hh|h|mm|ss|A|a/g

const timeParts = (value: DateTimeString): Readonly<Record<string, string>> => {
  const total = timeSeconds(timeOf(value))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const twelve = hours % 12 === 0 ? 12 : hours % 12

  return {
    HH: pad(hours),
    H: String(hours),
    hh: pad(twelve),
    h: String(twelve),
    mm: pad(minutes),
    ss: pad(seconds),
    A: hours < 12 ? "AM" : "PM",
    a: hours < 12 ? "am" : "pm"
  }
}

export const formatDateTime = (value: DateTimeString, format: DateLabelFormat, locale = "en"): string => {
  if (typeof format === "function") return format(value)
  const parts = timeParts(value)
  const withTimes = format.replace(timeTokens, (token: string, escaped: string | undefined) =>
    escaped === undefined ? `[${String(parts[token])}]` : token
  )

  return formatDate(dateOf(value), withTimes, locale)
}
