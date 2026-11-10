import { Array as Arr, Option } from "effect"
import { formatDate, parseDate, toIso } from "./date.ts"
import type { DateString } from "./date.ts"

type Field = "year" | "shortYear" | "monthName" | "month" | "day"

type Part = { readonly pattern: string; readonly field: Option.Option<Field> }

const tokenPattern = /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|d|./gu

const escape = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&")

const months = Arr.makeBy(12, (index) => index + 1)

const monthNames = (locale: string): ReadonlyArray<readonly [string, number]> =>
  months
    .flatMap((month) =>
      ["MMMM", "MMM"].map((format) => {
        const name = formatDate(toIso({ year: 2000, month, day: 1 }), format, locale).toLowerCase()

        return [name, month] as const
      })
    )
    .toSorted((a, b) => b[0].length - a[0].length)

const field = (pattern: string, name: Field): Part => ({ pattern: `(${pattern})`, field: Option.some(name) })

const literal = (pattern: string): Part => ({ pattern, field: Option.none() })

const partOf = (token: RegExpMatchArray, names: ReadonlyArray<readonly [string, number]>): Part => {
  const [text, escaped] = token
  if (escaped !== undefined) return literal(escape(escaped))
  if (text === "YYYY") return field("\\d{4}", "year")
  if (text === "YY") return field("\\d{2}", "shortYear")
  if (text === "MMMM" || text === "MMM") return field(names.map(([name]) => escape(name)).join("|"), "monthName")
  if (text === "MM" || text === "M") return field("\\d{1,2}", "month")
  if (text === "DD" || text === "D") return field("\\d{1,2}", "day")
  if (/^d+$/u.test(text)) return literal("\\p{L}+\\.?")
  if (/\s/u.test(text)) return literal("\\s+")

  return literal(escape(text))
}

type Fields = Partial<Record<Field, string>>

const civil = (fields: Fields, names: ReadonlyArray<readonly [string, number]>) => {
  const year = fields.year ?? (fields.shortYear === undefined ? undefined : `20${fields.shortYear}`)
  const named = Option.fromNullishOr(names.find(([name]) => name === fields.monthName?.toLowerCase()))
  const month = Option.match(named, { onNone: () => fields.month, onSome: ([, number]) => String(number) })
  if (year === undefined || month === undefined || fields.day === undefined) return Option.none()

  return parseDate(`${year}-${month.padStart(2, "0")}-${fields.day.padStart(2, "0")}`)
}

export const parseFormatted = (text: string, format: string, locale = "en"): Option.Option<DateString> => {
  const names = monthNames(locale)
  const parts = Array.from(format.matchAll(tokenPattern), (token) => partOf(token, names))
  const fields = parts.flatMap((part) => Option.toArray(part.field))
  const match = new RegExp(`^\\s*${parts.map((part) => part.pattern).join("")}\\s*$`, "iu").exec(text)

  return Option.flatMap(Option.fromNullishOr(match), (found) => {
    const values: Fields = Object.fromEntries(fields.map((name, index) => [name, found[index + 1]]))

    return Option.map(civil(values, names), toIso)
  })
}

export const parseDateInput = (text: string, format: string, locale = "en"): Option.Option<DateString> =>
  Option.orElse(parseFormatted(text, format, locale), () => Option.map(parseDate(text), toIso))
