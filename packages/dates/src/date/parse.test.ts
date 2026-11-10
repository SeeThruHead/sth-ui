import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import { formatDate, toIso } from "./date.ts"
import { parseDateInput, parseFormatted } from "./parse.ts"

describe("typed dates, as dayjs's customParseFormat", () => {
  it("reads Mantine's default format and others", () => {
    expect(parseFormatted("May 9, 2024", "MMMM D, YYYY")).toEqual(Option.some("2024-05-09"))
    expect(parseFormatted("  september 30, 1999 ", "MMMM D, YYYY")).toEqual(Option.some("1999-09-30"))
    expect(parseFormatted("Sep 3, 1999", "MMM D, YYYY")).toEqual(Option.some("1999-09-03"))
    expect(parseFormatted("09/03/24", "DD/MM/YY")).toEqual(Option.some("2024-03-09"))
    expect(parseFormatted("Monday 1.4.2024", "dddd D.M.YYYY")).toEqual(Option.some("2024-04-01"))
    expect(parseFormatted("on 2024 01 05", "[on] YYYY MM DD")).toEqual(Option.some("2024-01-05"))
    expect(parseFormatted("9 mai 2024", "D MMMM YYYY", "fr")).toEqual(Option.some("2024-05-09"))
  })

  it("refuses text that does not fit or a day that does not exist", () => {
    expect(parseFormatted("May 9", "MMMM D, YYYY")).toEqual(Option.none())
    expect(parseFormatted("February 30, 2024", "MMMM D, YYYY")).toEqual(Option.none())
    expect(parseFormatted("13/13/2024", "DD/MM/YYYY")).toEqual(Option.none())
    expect(parseFormatted("2024", "YYYY")).toEqual(Option.none())
    expect(parseFormatted("May 2024", "MMMM YYYY")).toEqual(Option.none())
    expect(parseFormatted("3 2024", "D YYYY")).toEqual(Option.none())
    expect(parseFormatted("9 May", "D MMMM")).toEqual(Option.none())
  })

  it("falls back to an ISO date, as Mantine's dateStringParser", () => {
    expect(parseDateInput("2024-05-09", "MMMM D, YYYY")).toEqual(Option.some("2024-05-09"))
    expect(parseDateInput("May 9, 2024", "MMMM D, YYYY")).toEqual(Option.some("2024-05-09"))
    expect(parseDateInput("tomorrow", "MMMM D, YYYY")).toEqual(Option.none())
  })

  it.prop(
    "reads back what it formats",
    [
      Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 9999 })),
      Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 12 })),
      Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 28 }))
    ],
    ([year, month, day]) => {
      const date = toIso({ year, month, day })

      expect(parseFormatted(formatDate(date, "MMMM D, YYYY"), "MMMM D, YYYY")).toEqual(Option.some(date))
    }
  )
})
