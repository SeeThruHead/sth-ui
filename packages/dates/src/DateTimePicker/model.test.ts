import * as Popover from "@foldkit/ui/popover"
import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { popoverClosed, popoverOpened } from "@sth-ui/core/testing/popover.ts"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import * as Picker from "../picker/model.ts"
import * as Inline from "../InlineDateTimePicker/model.ts"
import { FocusField, FocusMessage } from "../TimePicker/focus.ts"
import { gotInline, gotPopover, init, Message, OutMessage, setValue, update } from "./model.ts"
import type { DateTimeContext } from "../InlineDateTimePicker/model.ts"
import type { Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const today = "2024-05-09"

const dateTimePicker = (context: DateTimeContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const opened = (from: Model) => ({ ...from, popover: Popover.open(from.popover).model })

const pick = (date: string) => gotInline(Inline.Message.GotPicker({ message: Picker.Message.Picked({ date }) }))

const clicked = gotPopover(Popover.Message.ClickedButton())

const isOpen = (expected: boolean) => model<Model>((current) => expect(current.popover.isOpen).toBe(expected))

describe("date time picker state, as Mantine's DateTimePicker", () => {
  it("opens and closes with the button", () =>
    story(
      withDefaults,
      given(init({ id: "dtp", today })),
      message(clicked),
      expectOutMessage([OutMessage.Opened()]),
      popoverOpened(),
      message(clicked),
      expectOutMessage([OutMessage.Closed()]),
      popoverClosed()
    ))

  it("ignores the popover's finished focus", () =>
    story(
      withDefaults,
      given(init({ id: "dtp", today })),
      message(gotPopover(Popover.Message.CompletedFocusButton())),
      expectNoOutMessage()
    ))

  it("reports picks and closes on submit", () =>
    story(
      withDefaults,
      given(opened(init({ id: "dtp", today, value: ["2024-05-14 10:30:00"] }))),
      message(pick("2024-05-20")),
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-20 10:30:00"] })]),
      isOpen(true),
      Command.expectExact(FocusField({ selector: "#dtp-inline-start-hours" })),
      Command.resolve(FocusField, FocusMessage.CompletedFocus()),
      message(gotInline(Inline.Message.CompletedFocus())),
      expectNoOutMessage(),
      message(gotInline(Inline.Message.Submitted())),
      isOpen(false),
      expectOutMessage([OutMessage.Closed()]),
      popoverClosed(1)
    ))

  it("drops a half range on close", () =>
    story(
      withDefaults,
      given(modelAfter(withDefaults, opened(init({ id: "dtp", today, type: "range" })), [pick("2024-05-10")])),
      message(clicked),
      model((current) => expect(current.inline.value).toEqual([])),
      expectOutMessage([OutMessage.Changed({ value: [] }), OutMessage.Closed()]),
      popoverClosed(1)
    ))

  it("clamps to the limits on close", () =>
    story(
      dateTimePicker({ maxDate: "2024-05-20 18:00:00" }),
      given(setValue(opened(init({ id: "dtp", today })), ["2024-05-20 23:00:00"])),
      message(clicked),
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-20 18:00:00"] }), OutMessage.Closed()]),
      popoverClosed(1)
    ))

  it("clears", () =>
    story(
      withDefaults,
      given(init({ id: "dtp", today, value: ["2024-05-14 10:30:00"] })),
      message(Message.Cleared()),
      expectOutMessage([OutMessage.Changed({ value: [] })]),
      model((current) => expect(current.inline.value).toEqual([]))
    ))
})
