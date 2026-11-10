import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import * as Calendar from "../Calendar/model.ts"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { calendarContext, init, Message, OutMessage, setValue, stateOf, update } from "./model.ts"
import type { Model, PickerOptions } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const picker = (options: PickerOptions = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const after = (from: Model, messages: ReadonlyArray<Message>) => modelAfter(withDefaults, from, messages)

const calendarSays = (inner: Calendar.Message) => Message.GotCalendar({ message: inner })

const value = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.selection.value).toEqual(expected))

const calendarIs = (expected: object) => model<Model>((current) => expect(current.calendar).toMatchObject(expected))

const days = init({ id: "p", today: "2024-05-09" })

describe("picker state, as Mantine's pickers", () => {
  it("opens at the date, else the first value, else today", () => {
    expect(days.calendar).toEqual({ id: "p", date: "2024-05-01", level: "month" })
    expect(init({ id: "p", today: "2024-05-09", value: ["2022-03-04"] }).calendar.date).toBe("2022-03-01")
    expect(init({ id: "p", today: "2024-05-09", date: "2021-01-20", value: ["2022-03-04"] }).calendar.date).toBe(
      "2021-01-01"
    )
    expect(init({ id: "p", today: "2024-05-09", level: "month" }).calendar.level).toBe("year")
    expect(init({ id: "p", today: "2024-05-09", level: "year", calendarLevel: "month" }).calendar.level).toBe("decade")
    expect(calendarContext(init({ id: "p", today: "2024-05-09", level: "year" }), { numberOfColumns: 2 })).toEqual({
      numberOfColumns: 2,
      minLevel: "decade"
    })
  })

  it("picks days and reports the value", () =>
    story(
      withDefaults,
      given(days),
      message(Message.Picked({ date: "2024-05-12" })),
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-12"] })]),
      model((current) => expect(stateOf(current, "2024-05-12").selected).toBe(true))
    ))

  it("deselects a picked day when allowed", () =>
    story(
      picker({ allowDeselect: true }),
      given(after(days, [Message.Picked({ date: "2024-05-12" })])),
      message(Message.Picked({ date: "2024-05-12" })),
      value([])
    ))

  it("previews a range while hovering and forgets it on leaving", () =>
    story(
      withDefaults,
      given(after(init({ id: "p", today: "2024-05-09", type: "range" }), [Message.Picked({ date: "2024-05-10" })])),
      message(Message.Hovered({ date: "2024-05-14" })),
      expectNoOutMessage(),
      model((current) => expect(stateOf(current, "2024-05-12").inRange).toBe(true)),
      message(Message.Left()),
      model((current) => expect(current.selection.hovered).toEqual(Option.none()))
    ))

  it("picks a month from the calendar's list without going down a level", () =>
    story(
      withDefaults,
      given(init({ id: "p", today: "2024-05-09", level: "month", type: "multiple" })),
      message(calendarSays(Calendar.Message.ChoseMonth({ month: "2024-07-01" }))),
      calendarIs({ level: "year" }),
      expectOutMessage([
        OutMessage.GotCalendar({ message: Calendar.OutMessage.MonthSelected({ month: "2024-07-01" }) }),
        OutMessage.Changed({ value: ["2024-07-01"] })
      ])
    ))

  it("picks a year from the calendar's list", () =>
    story(
      withDefaults,
      given(init({ id: "p", today: "2024-05-09", level: "year" })),
      message(calendarSays(Calendar.Message.ChoseYear({ year: "2027-01-01" }))),
      value(["2027-01-01"]),
      calendarIs({ level: "decade" })
    ))

  it("pages the calendar and passes its messages on", () =>
    story(
      picker({ numberOfColumns: 2 }),
      given(days),
      message(calendarSays(Calendar.Message.Next())),
      calendarIs({ date: "2024-07-01" }),
      expectOutMessage([OutMessage.GotCalendar({ message: Calendar.OutMessage.DateChanged({ date: "2024-07-01" }) })])
    ))

  it("goes down a level when choosing a month while picking days", () =>
    story(
      withDefaults,
      given(after(days, [calendarSays(Calendar.Message.LevelUp())])),
      message(calendarSays(Calendar.Message.ChoseMonth({ month: "2024-02-01" }))),
      value([])
    ))

  it("applies a preset and shows its first date", () => {
    const up = after(init({ id: "p", today: "2024-05-09", type: "range" }), [calendarSays(Calendar.Message.LevelUp())])
    story(
      withDefaults,
      given(up),
      message(Message.ChosePreset({ value: ["2023-12-25", "2024-01-02"] })),
      model((current) => expect(current.calendar).toEqual({ id: "p", date: "2023-12-01", level: "month" })),
      expectOutMessage([OutMessage.Changed({ value: ["2023-12-25", "2024-01-02"] })])
    )
    story(
      withDefaults,
      given(up),
      message(Message.ChosePreset({ value: [] })),
      model((current) => expect(current.calendar).toEqual(up.calendar))
    )
  })

  it("can be given a value", () => {
    expect(setValue(days, ["2024-05-02"]).selection.value).toEqual(["2024-05-02"])
  })
})
