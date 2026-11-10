import { describe, expect, it } from "@effect/vitest"
import { emptyFields } from "../time/clock.ts"
import { Array as Arr } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { FocusField, FocusMessage } from "./focus.ts"
import { boundsOf, fieldId, formatOf, hiddenValue, init, Message, OutMessage, setValue, update } from "./model.ts"
import type { Model, TimePickerContext } from "./model.ts"

const twelve: TimePickerContext = { format: "12h" }
const seconds: TimePickerContext = { withSeconds: true }

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const timePicker = (context: TimePickerContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (from: Model, sent: Message, context: TimePickerContext, ...steps: ReadonlyArray<Step>) =>
  story(timePicker(context), given(from), message(sent), ...steps, settled)

const focusOn = (field: string) =>
  Story.steps(
    Command.expectExact(FocusField({ selector: `#t-${field}` })),
    Command.resolve(FocusField, FocusMessage.CompletedFocus())
  )

const settled = Command.resolveAll(...Arr.makeBy(3, () => [FocusField, FocusMessage.CompletedFocus()] as const))

const changed = (value: string) => expectOutMessage([OutMessage.Changed({ value })])

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const unchanged = (from: Model, sent: Message, context: TimePickerContext = {}) =>
  step(
    from,
    sent,
    context,
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage(),
    Command.expectNone()
  )

const empty = init({ id: "t" })

const filled = init({ id: "t", value: "14:30" })

const pm = init({ id: "t", value: "14:30" }, twelve)

const type = (field: "hours" | "minutes" | "seconds", text: string) => Message.Typed({ field, text })

const key = (field: "hours" | "minutes" | "seconds", pressed: string, wholeSelected = false) =>
  Message.PressedKey({ field, key: pressed, wholeSelected })

const amPmKey = (pressed: string, code = "") => Message.PressedAmPmKey({ key: pressed, code })

describe("time picker state, as Mantine's useTimePicker", () => {
  it("reads the value into fields", () => {
    expect(filled.fields).toEqual({ hours: 14, minutes: 30, seconds: null, amPm: null })
    expect(filled.wasInvalid).toBe(false)
    expect(empty.wasInvalid).toBe(true)
    expect(init({ id: "t", value: "14:30" }, twelve).fields).toEqual({
      hours: 2,
      minutes: 30,
      seconds: null,
      amPm: "PM"
    })
    expect(fieldId("t", "amPm")).toBe("t-amPm")
    expect(formatOf({ type: "duration", format: "12h" })).toBe("24h")
  })

  it("bounds each field by the format and steps", () => {
    expect(boundsOf("hours", {})).toEqual({ min: 0, max: 23, step: 1 })
    expect(boundsOf("hours", { ...twelve, hoursStep: 2 })).toEqual({ min: 1, max: 12, step: 2 })
    expect(boundsOf("hours", { type: "duration" }).max).toBe(Number.POSITIVE_INFINITY)
    expect(boundsOf("minutes", { minutesStep: 5 })).toEqual({ min: 0, max: 59, step: 5 })
    expect(boundsOf("seconds", { secondsStep: 10 })).toEqual({ min: 0, max: 59, step: 10 })
  })

  it("reports the value once the shown fields are filled, and empty once when it stops being whole", () =>
    story(
      timePicker({}),
      given(empty),
      message(type("hours", "9")),
      has({ fields: { hours: 9 } }),
      expectNoOutMessage(),
      focusOn("minutes"),
      message(type("minutes", "07")),
      changed("09:07"),
      settled,
      message(key("minutes", "Backspace")),
      changed(""),
      settled,
      message(key("hours", "Backspace")),
      expectNoOutMessage(),
      settled
    ))

  it("waits for a second digit that could still follow, and ignores what is not a digit", () => {
    step(empty, type("hours", "1"), {}, focusOn("hours"))
    unchanged(empty, type("hours", "x"))
    step(empty, type("hours", "5"), { type: "duration" }, focusOn("hours"))
  })

  it("moves between fields with the arrow keys", () => {
    step(filled, key("hours", "ArrowRight"), {}, focusOn("minutes"))
    step(filled, key("hours", "ArrowLeft"), {}, Command.expectNone())
    step(filled, key("minutes", "ArrowLeft"), {}, focusOn("hours"))
    step(filled, key("minutes", "ArrowRight"), {}, Command.expectNone())
    step(filled, key("minutes", "ArrowRight"), seconds, focusOn("seconds"))
    step(filled, key("seconds", "ArrowLeft"), seconds, focusOn("minutes"))
    step(filled, key("minutes", "ArrowRight"), twelve, focusOn("amPm"))
    step(filled, key("seconds", "ArrowRight"), { ...twelve, withSeconds: true }, focusOn("amPm"))
  })

  it("steps a field with the arrow keys, and ignores other keys", () => {
    step(filled, key("hours", "ArrowUp"), {}, changed("15:30"))
    unchanged(filled, key("hours", "x"))
  })

  it("wraps 12 hour input and turns a left-behind zero into 12", () => {
    step(pm, Message.ChoseNumber({ field: "hours", value: 13 }), twelve, has({ fields: { hours: 1 } }))
    step(pm, Message.LeftHours({ text: "00" }), twelve, changed("12:30"))
    step(pm, Message.LeftHours({ text: "05" }), twelve, expectNoOutMessage())
    step(pm, Message.LeftHours({ text: "" }), twelve, expectNoOutMessage())
    step(filled, Message.LeftHours({ text: "00" }), {}, expectNoOutMessage())
  })

  it("follows Mantine's am/pm keys", () => {
    step(pm, amPmKey("Home"), twelve, changed("02:30"))
    step(pm, amPmKey("a", "KeyA"), twelve, has({ fields: { amPm: "AM" } }))
    step(pm, amPmKey("End"), twelve, has({ fields: { amPm: "PM" } }))
    step(pm, amPmKey("p", "KeyP"), twelve, has({ fields: { amPm: "PM" } }))
    step(pm, amPmKey("ArrowUp"), twelve, has({ fields: { amPm: "AM" } }))
    step({ ...pm, fields: { ...pm.fields, amPm: "AM" } }, amPmKey("ArrowDown"), twelve, has({ fields: { amPm: "PM" } }))
    step(
      pm,
      amPmKey("Backspace"),
      twelve,
      model((current) => expect(current.fields.amPm).toBeNull())
    )
    step({ ...pm, fields: { ...pm.fields, amPm: null } }, amPmKey("Delete"), twelve, focusOn("minutes"))
    step(pm, amPmKey("ArrowLeft"), twelve, focusOn("minutes"))
    step(pm, amPmKey("ArrowLeft"), { ...twelve, withSeconds: true }, focusOn("seconds"))
    step(pm, amPmKey("x"), twelve, expectNoOutMessage())
    step(pm, Message.ChoseAmPm({ value: "AM" }), twelve, changed("02:30"))
  })

  it("parses and clamps a paste", () => {
    step(empty, Message.Pasted({ text: "25:61" }), { max: "20:00" }, changed("20:00"))
    step(
      empty,
      Message.Pasted({ text: "07:15" }),
      {},
      model((current) => expect(current.fields).toEqual({ hours: 7, minutes: 15, seconds: null, amPm: null }))
    )
    step(empty, Message.Pasted({ text: "30:00:00" }), { type: "duration", withSeconds: true }, changed("30:00:00"))
    step(empty, Message.Pasted({ text: "nope" }), {}, expectNoOutMessage())
    step(
      empty,
      Message.Pasted({ text: "7.15" }),
      { pasteSplit: () => ({ hours: 7, minutes: 15, seconds: null, amPm: null }) },
      changed("07:15")
    )
  })

  it("opens on focus and reports focus once", () =>
    story(
      timePicker({}),
      given(empty),
      message(Message.FocusedField()),
      has({ opened: true, focused: true }),
      expectOutMessage([OutMessage.Focused()]),
      message(Message.FocusedField()),
      expectNoOutMessage()
    ))

  it("stays closed while disabled, and focuses the hours on a click", () => {
    step(empty, Message.FocusedField(), { disabled: true }, has({ opened: false }))
    step(empty, Message.ClickedRoot(), {}, focusOn("hours"))
  })

  it("clamps on leaving", () => {
    const late = { ...filled, opened: true, focused: true }
    step(
      late,
      Message.LeftFields(),
      { max: "12:00" },
      has({ opened: false, focused: false, fields: { hours: 12, minutes: 0 } }),
      expectOutMessage([OutMessage.Changed({ value: "12:00" }), OutMessage.Blurred()])
    )
    step(late, Message.LeftFields(), { min: "12:00" }, expectOutMessage([OutMessage.Blurred()]))
    step(late, Message.LeftFields(), {}, expectOutMessage([OutMessage.Blurred()]))
  })

  it("clears and focuses the hours", () => {
    step(
      filled,
      Message.Cleared(),
      {},
      model((current) => expect(current).toEqual({ ...filled, fields: emptyFields, wasInvalid: true })),
      changed(""),
      focusOn("hours")
    )
    expect(FocusField({ selector: "#x" }).name).toBe("TimePickerFocusField")
  })

  it("takes presets, closing the dropdown when asked", () => {
    const open = { ...filled, opened: true }
    step(open, Message.ChosePreset({ value: "09:15" }), {}, has({ opened: true, fields: { hours: 9, minutes: 15 } }))
    step(open, Message.ChosePreset({ value: "09:15" }), { closeDropdownOnPresetSelect: true }, has({ opened: false }))
  })

  it("ignores edits when read only, and finished focus", () => {
    unchanged(filled, type("hours", "9"), { readOnly: true })
    step(filled, Message.FocusedField(), { readOnly: true }, has({ focused: true }))
    story(
      withDefaults,
      given(filled),
      message(Message.CompletedFocus()),
      model((current) => expect(current).toEqual(filled))
    )
  })

  it("can be given a value and gives the hidden value", () => {
    expect(setValue(empty, "08:05").fields.hours).toBe(8)
    expect(setValue(filled, "").wasInvalid).toBe(true)
    expect(hiddenValue(filled)).toBe("14:30")
    expect(hiddenValue(empty)).toBe("")
  })
})
