import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import * as Picker from "../picker/model.ts"
import * as TimePicker from "../TimePicker/model.ts"
import { FocusField, FocusMessage } from "../TimePicker/focus.ts"
import {
  completedFocus,
  dateLimits,
  init,
  liftTime,
  Message,
  OutMessage,
  pickerOptions,
  setValue,
  timeContext,
  update
} from "./model.ts"
import type { DateTimeContext, Model } from "./model.ts"

const today = "2024-05-09"

const pick = (date: string) => Message.GotPicker({ message: Picker.Message.Picked({ date }) })

const startTime = (field: "hours" | "minutes", text: string) =>
  Message.GotStart({ message: TimePicker.Message.Typed({ field, text }) })

const endTime = (field: "hours" | "minutes", text: string) =>
  Message.GotEnd({ message: TimePicker.Message.Typed({ field, text }) })

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const dateTime = (context: DateTimeContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const after = (from: Model, messages: ReadonlyArray<Message>, context: DateTimeContext = {}) =>
  modelAfter(dateTime(context), from, messages)

const step = (from: Model, sent: Message, context: DateTimeContext, ...steps: ReadonlyArray<Step>) =>
  story(dateTime(context), given(from), message(sent), ...steps)

const value = (expected: ReadonlyArray<string>) => model<Model>((current) => expect(current.value).toEqual(expected))

const changed = (expected: ReadonlyArray<string>) => expectOutMessage([OutMessage.Changed({ value: expected })])

const focusedTime = Command.resolveAll([FocusField, FocusMessage.CompletedFocus()])

describe("date and time state, as Mantine's InlineDateTimePicker", () => {
  it("starts from the value's dates and times", () => {
    const started = init({ id: "dt", today, value: ["2024-05-14 10:30:00"] })
    expect(started.picker.selection.value).toEqual(["2024-05-14"])
    expect(started.startTime).toBe("10:30")
    expect(started.start.fields).toMatchObject({ hours: 10, minutes: 30 })
    expect(init({ id: "dt", today, value: ["2024-05-14 10:30:05"] }, { withSeconds: true }).startTime).toBe("10:30:05")
    expect(init({ id: "dt", today }, { defaultTimeValue: "09:00" })).toMatchObject({
      startTime: "09:00",
      endTime: "09:00"
    })
    expect(init({ id: "dt", today, type: "range", value: ["2024-05-01 08:00", "2024-05-03 18:00"] })).toMatchObject({
      startTime: "08:00",
      endTime: "18:00"
    })
    expect(init({ id: "dt", today, date: "2024-01-01" }).picker.calendar.date).toBe("2024-01-01")
  })

  it("puts a picked day at the chosen time and focuses the time", () =>
    step(
      init({ id: "dt", today, value: ["2024-05-14 10:30:00"] }),
      pick("2024-05-20"),
      {},
      changed(["2024-05-20 10:30:00"]),
      Command.expectExact(FocusField),
      focusedTime
    ))

  it("picks at midnight, the default time, or the earliest allowed", () => {
    step(init({ id: "dt", today }), pick("2024-05-20"), {}, changed(["2024-05-20 00:00:00"]), focusedTime)
    step(
      init({ id: "dt", today }),
      pick("2024-05-20"),
      { defaultTimeValue: "12:00" },
      value(["2024-05-20 12:00:00"]),
      focusedTime
    )
    step(
      init({ id: "dt", today }),
      pick("2024-05-20"),
      { minDate: "2024-05-20 09:30:00" },
      value(["2024-05-20 09:30:00"]),
      focusedTime
    )
  })

  it("keeps the picked day when picked again, even when deselecting is allowed", () =>
    step(
      after(init({ id: "dt", today, value: ["2024-05-14 10:30:00"] }), [pick("2024-05-20")]),
      pick("2024-05-20"),
      { allowDeselect: true },
      expectNoOutMessage(),
      value(["2024-05-20 10:30:00"]),
      focusedTime
    ))

  it("keeps a time with no day for the next pick", () =>
    story(
      withDefaults,
      given(init({ id: "dt", today })),
      message(startTime("hours", "14")),
      focusedTime,
      message(startTime("minutes", "45")),
      focusedTime,
      model((current) => expect(current.startTime).toBe("14:45")),
      expectNoOutMessage(),
      message(pick("2024-05-02")),
      value(["2024-05-02 14:45:00"]),
      focusedTime
    ))

  it("sets the time of the picked day", () => {
    const dated = init({ id: "dt", today, value: ["2024-05-14 10:30:00"] })
    step(dated, startTime("hours", "16"), {}, changed(["2024-05-14 16:30:00"]), focusedTime)
    step(dated, Message.GotStart({ message: TimePicker.Message.Cleared() }), {}, expectNoOutMessage(), focusedTime)
    step(dated, Message.GotStart({ message: TimePicker.Message.CompletedFocus() }), {}, expectNoOutMessage())
  })

  it("picks a range at the start and end times", () => {
    const context = { defaultTimeValue: "09:00" }
    story(
      dateTime(context),
      given(init({ id: "dt", today, type: "range" }, context)),
      message(pick("2024-05-10")),
      changed(["2024-05-10 09:00:00"]),
      Command.expectNone(),
      message(pick("2024-05-12")),
      changed(["2024-05-10 09:00:00", "2024-05-12 09:00:00"]),
      Command.expectExact(FocusField),
      focusedTime,
      message(endTime("hours", "18")),
      value(["2024-05-10 09:00:00", "2024-05-12 18:00:00"]),
      focusedTime
    )
  })

  it("keeps an end time typed before the range ends", () => {
    const context = { defaultTimeValue: "09:00" }
    const started = after(init({ id: "dt", today, type: "range" }, context), [pick("2024-05-10")], context)
    step(started, endTime("hours", "18"), {}, expectNoOutMessage(), focusedTime)
    story(
      dateTime(context),
      given(started),
      message(endTime("hours", "18")),
      focusedTime,
      message(endTime("minutes", "15")),
      focusedTime,
      model((current) => expect(current.endTime).toBe("18:15")),
      message(pick("2024-05-12")),
      value(["2024-05-10 09:00:00", "2024-05-12 18:15:00"]),
      focusedTime
    )
  })

  it("picks a range at midnight without a default time", () =>
    story(
      withDefaults,
      given(init({ id: "dt", today, type: "range" })),
      message(pick("2024-05-10")),
      message(pick("2024-05-11")),
      value(["2024-05-10 00:00:00", "2024-05-11 00:00:00"]),
      focusedTime
    ))

  it("limits the times on the limit days and passes paging through", () => {
    const ranged = init({ id: "dt", today, type: "range", value: ["2024-05-09 10:00", "2024-05-20 10:00"] })
    const context = { minDate: "2024-05-09 08:30:00", maxDate: "2024-05-20 17:00:00" }
    expect(timeContext(ranged, "start", context)).toMatchObject({ min: "08:30:00", withSeconds: false })
    expect(timeContext(ranged, "end", context)).toMatchObject({ max: "17:00:00" })
    expect(timeContext(ranged, "end", context)).not.toHaveProperty("min")
    expect(timeContext(ranged, "start", { timePicker: { format: "12h" } })).toMatchObject({ format: "12h" })
    expect(dateLimits(context)).toEqual({ minDate: "2024-05-09", maxDate: "2024-05-20" })
    expect(dateLimits({})).toEqual({})
    expect(pickerOptions({ ...context, withSeconds: true, allowDeselect: true, numberOfColumns: 2 })).toEqual({
      allowDeselect: true,
      numberOfColumns: 2
    })
    story(
      withDefaults,
      given(ranged),
      message(Message.GotPicker({ message: Picker.Message.GotCalendar({ message: { _tag: "Next" } }) })),
      expectNoOutMessage(),
      model((current) => expect(current.picker.calendar.date).toBe("2024-06-01"))
    )
  })

  it("submits, and can be given a value", () => {
    expect(liftTime("start")(TimePicker.Message.Cleared())).toEqual(
      Message.GotStart({ message: TimePicker.Message.Cleared() })
    )
    expect(liftTime("end")(TimePicker.Message.Cleared())).toEqual(
      Message.GotEnd({ message: TimePicker.Message.Cleared() })
    )
    expect(completedFocus()).toEqual(Message.CompletedFocus())
    const fresh = init({ id: "dt", today })
    story(withDefaults, given(fresh), message(Message.Submitted()), expectOutMessage([OutMessage.Submitted()]))
    story(withDefaults, given(fresh), message(Message.CompletedFocus()), expectNoOutMessage())
    expect(setValue(fresh, ["2024-02-02 02:02:00"])).toMatchObject({
      startTime: "02:02",
      value: ["2024-02-02 02:02:00"]
    })
  })
})
