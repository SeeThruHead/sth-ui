import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { clampLevel, init, Message, OutMessage, setDate, update } from "./model.ts"
import type { CalendarContext as Context, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const start = init({ id: "calendar", date: "2024-05-17" })

const calendar = (context: Context) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (from: Model, sent: Message, context: Context, ...steps: ReadonlyArray<Step>) =>
  story(calendar(context), given(from), message(sent), ...steps)

const key = (k: string, ctrlKey = false, shiftKey = false) => Message.PressedPageKey({ key: k, ctrlKey, shiftKey })

const date = (expected: string) => model<Model>((current) => expect(current.date).toBe(expected))

const level = (expected: string) => model<Model>((current) => expect(current.level).toBe(expected))

const is = (expected: Model) => model<Model>((current) => expect(current).toEqual(expected))

describe("calendar state, as Mantine's Calendar", () => {
  it("starts at the month of the date, at the lowest allowed level", () => {
    expect(start).toEqual({ id: "calendar", date: "2024-05-01", level: "month" })
    expect(init({ id: "c", date: "2024-05-17", level: "decade" }, { maxLevel: "year" }).level).toBe("year")
    expect(init({ id: "c", date: "2024-05-17" }, { minLevel: "year" }).level).toBe("year")
    expect(clampLevel("month", { minLevel: "decade" })).toBe("decade")
  })

  it("pages by month, year or decade, by the columns to scroll", () => {
    story(
      withDefaults,
      given(start),
      message(Message.Next()),
      is({ ...start, date: "2024-06-01" }),
      expectOutMessage([OutMessage.DateChanged({ date: "2024-06-01" })])
    )
    step(start, Message.Previous(), { numberOfColumns: 3 }, date("2024-02-01"))
    step(start, Message.Previous(), { numberOfColumns: 3, columnsToScroll: 1 }, date("2024-04-01"))
    step({ ...start, level: "year" }, Message.Next(), {}, date("2025-05-01"))
    step({ ...start, level: "decade" }, Message.Previous(), { numberOfColumns: 2 }, date("2004-05-01"))
  })

  it("goes up a level unless it is the highest allowed", () => {
    step(
      start,
      Message.LevelUp(),
      {},
      is({ ...start, level: "year" }),
      expectOutMessage([OutMessage.LevelChanged({ level: "year" })])
    )
    step({ ...start, level: "year" }, Message.LevelUp(), {}, level("decade"))
    step(
      { ...start, level: "year" },
      Message.LevelUp(),
      { maxLevel: "year" },
      is({ ...start, level: "year" }),
      expectNoOutMessage()
    )
  })

  it("goes down into a chosen year or month, and reports the choice", () => {
    step(
      { ...start, level: "decade" },
      Message.ChoseYear({ year: "2027-01-01" }),
      {},
      is({ ...start, level: "year", date: "2027-01-01" }),
      expectOutMessage([OutMessage.YearSelected({ year: "2027-01-01" }), OutMessage.LevelChanged({ level: "year" })])
    )
    step(
      { ...start, level: "year" },
      Message.ChoseMonth({ month: "2024-09-01" }),
      {},
      is({ ...start, level: "month", date: "2024-09-01" }),
      expectOutMessage([OutMessage.MonthSelected({ month: "2024-09-01" }), OutMessage.LevelChanged({ level: "month" })])
    )
  })

  it("stays at the lowest allowed level when choosing", () => {
    step(
      { ...start, level: "year" },
      Message.ChoseMonth({ month: "2024-09-01" }),
      { minLevel: "year" },
      is({ ...start, level: "year" }),
      expectOutMessage([OutMessage.MonthSelected({ month: "2024-09-01" })])
    )
    step(
      { ...start, level: "decade" },
      Message.ChoseYear({ year: "2027-01-01" }),
      { minLevel: "decade" },
      level("decade")
    )
  })

  it("follows Mantine's page keys", () => {
    step(start, key("ArrowUp", true), {}, date("2023-05-01"))
    step(start, key("ArrowDown", true), {}, date("2025-05-01"))
    step(start, key("ArrowDown", true, true), {}, date("2034-05-01"))
    step(start, key("ArrowDown"), {}, expectNoOutMessage())
    step(start, key("ArrowLeft", true), {}, expectNoOutMessage())
    step(start, key("Y"), {}, level("year"))
    step({ ...start, level: "decade" }, key("y"), {}, expectNoOutMessage())
  })

  it("can be moved to another date", () => {
    expect(setDate(start, "2030-12-25")).toEqual({ ...start, date: "2030-12-01" })
  })
})
