import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import * as Calendar from "../Calendar/model.ts"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { init, Message, OutMessage, setValue, update } from "./model.ts"
import type { DateInputContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const dateInput = (context: DateInputContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (from: Model, sent: Message, context: DateInputContext, ...steps: ReadonlyArray<Step>) =>
  story(dateInput(context), given(from), message(sent), ...steps)

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const changed = (value: string | null) => expectOutMessage([OutMessage.Changed({ value })])

const today = "2024-05-09"

const empty = init({ id: "d", today })

const filled = init({ id: "d", today, value: "2024-05-14" })

describe("date input state, as Mantine's DateInput", () => {
  it("shows the value in its format and opens on the value's month", () => {
    expect(filled.text).toBe("May 14, 2024")
    expect(filled.calendar.date).toBe("2024-05-01")
    expect(init({ id: "d", today, value: "2024-05-14" }, { valueFormat: "DD/MM/YYYY" }).text).toBe("14/05/2024")
    expect(init({ id: "d", today, value: null }).text).toBe("")
    expect(empty.calendar.date).toBe("2024-05-01")
  })

  it("opens on focus and click, and closes on Escape", () => {
    story(withDefaults, given(empty), message(Message.Focused()), has({ opened: true }))
    story(
      withDefaults,
      given(empty),
      message(Message.Clicked()),
      has({ opened: true }),
      message(Message.Anchored()),
      has({ opened: true }),
      expectNoOutMessage(),
      message(Message.PressedEscape()),
      has({ opened: false })
    )
  })

  it("takes a typed date that parses and is within the limits", () => {
    step(
      empty,
      Message.Typed({ text: "June 3, 2024" }),
      {},
      changed("2024-06-03"),
      has({ text: "June 3, 2024", opened: true, calendar: { date: "2024-06-01" } })
    )
    step(empty, Message.Typed({ text: "June 3" }), {}, expectNoOutMessage())
    step(empty, Message.Typed({ text: "2024-06-03" }), { maxDate: "2024-05-31" }, expectNoOutMessage())
    step(
      empty,
      Message.Typed({ text: "3.6.24" }),
      { dateParser: () => Option.some("2024-06-03") },
      has({ value: "2024-06-03" })
    )
  })

  it("clears on empty text only when clearable or deselectable", () => {
    step(filled, Message.Typed({ text: " " }), {}, expectNoOutMessage())
    step(filled, Message.Typed({ text: "" }), { clearable: true }, changed(null))
    step(filled, Message.Typed({ text: "" }), { allowDeselect: true }, has({ value: null }))
  })

  it("puts the formatted value back on blur unless fixOnBlur is off", () => {
    const half = modelAfter(withDefaults, { ...filled, opened: true }, [Message.Typed({ text: "May 1" })])
    step(
      half,
      Message.Blurred(),
      {},
      model((current) => expect(current).toEqual({ ...half, opened: false, text: "May 14, 2024" }))
    )
    step(half, Message.Blurred(), { fixOnBlur: false }, has({ text: "May 1" }))
  })

  it("picks a day, deselecting it when clearable", () => {
    step(
      { ...empty, opened: true },
      Message.PickedDay({ date: "2024-05-20" }),
      {},
      has({ value: "2024-05-20", text: "May 20, 2024", opened: false })
    )
    step(filled, Message.PickedDay({ date: "2024-05-14" }), {}, has({ value: "2024-05-14" }))
    step(filled, Message.PickedDay({ date: "2024-05-14" }), { clearable: true }, has({ value: null, text: "" }))
    step(
      filled,
      Message.PickedDay({ date: "2024-05-14" }),
      { clearable: true, allowDeselect: false },
      has({ value: "2024-05-14" })
    )
  })

  it("applies presets, clears and pages", () => {
    step(
      empty,
      Message.ChosePreset({ value: "2023-12-25" }),
      {},
      has({ value: "2023-12-25", calendar: { date: "2023-12-01" } })
    )
    step(filled, Message.ChosePreset({ value: null }), {}, has({ value: null }))
    story(
      withDefaults,
      given(filled),
      message(Message.Cleared()),
      model((current) => expect(current).toEqual({ ...filled, value: null, text: "" })),
      changed(null)
    )
    step(
      empty,
      Message.GotCalendar({ message: Calendar.Message.Next() }),
      {},
      has({ calendar: { date: "2024-06-01" } })
    )
  })

  it("can be given a value", () => {
    expect(setValue(empty, "2025-01-02")).toMatchObject({
      value: "2025-01-02",
      text: "January 2, 2025",
      calendar: { date: "2025-01-01" }
    })
    expect(setValue(filled, null)).toMatchObject({ value: null, text: "", calendar: { date: "2024-05-01" } })
  })
})
