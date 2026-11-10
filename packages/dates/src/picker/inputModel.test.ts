import { describe, expect, it } from "@effect/vitest"
import * as Popover from "@foldkit/ui/popover"
import { Story } from "foldkit/test"
import { popoverClosed, popoverOpened } from "@sth-ui/core/testing/popover.ts"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import * as Calendar from "../Calendar/model.ts"
import * as Picker from "./model.ts"
import { defaultDateFormatter, hiddenValue } from "./format.ts"
import { gotPopover, init, Message, OutMessage, setValue, update } from "./inputModel.ts"
import type { Model, PickerInputOptions } from "./inputModel.ts"

const today = "2024-05-09"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const pickerInput = (options: PickerInputOptions) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (from: Model, sent: Message, options: PickerInputOptions, ...steps: ReadonlyArray<Step>) =>
  story(pickerInput(options), given(from), message(sent), ...steps)

const opened = (from: Model) => ({ ...from, popover: Popover.open(from.popover).model })

const pick = (date: string) => Message.GotPicker({ message: Picker.Message.Picked({ date }) })

const clicked = Message.GotPopover({ message: Popover.Message.ClickedButton() })

const isOpen = (expected: boolean) => model<Model>((current) => expect(current.popover.isOpen).toBe(expected))

const selected = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.picker.selection.value).toEqual(expected))

const range = () => opened(init({ id: "input", today, type: "range" }))

describe("picker inputs, as Mantine's useDatesInput", () => {
  it("opens and closes with the button", () => {
    expect(gotPopover(Popover.Message.ClickedButton())).toEqual(clicked)
    story(
      withDefaults,
      given(init({ id: "input", today })),
      message(clicked),
      isOpen(true),
      expectOutMessage([OutMessage.Opened()]),
      popoverOpened(),
      message(clicked),
      expectOutMessage([OutMessage.Closed()]),
      popoverClosed()
    )
    step(
      init({ id: "input", today }),
      Message.GotPopover({ message: Popover.Message.CompletedFocusButton() }),
      {},
      expectNoOutMessage()
    )
  })

  it("closes after one date, unless closeOnChange is off", () => {
    step(
      opened(init({ id: "input", today })),
      pick("2024-05-12"),
      {},
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-12"] }), OutMessage.Closed()]),
      isOpen(false),
      popoverClosed(1)
    )
    step(
      opened(init({ id: "input", today })),
      pick("2024-05-12"),
      { closeOnChange: false },
      isOpen(true),
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-12"] })])
    )
  })

  it("keeps a range open until it has both ends", () =>
    story(
      withDefaults,
      given(range()),
      message(pick("2024-05-12")),
      isOpen(true),
      selected(["2024-05-12"]),
      message(pick("2024-05-10")),
      expectOutMessage([OutMessage.Changed({ value: ["2024-05-10", "2024-05-12"] }), OutMessage.Closed()]),
      popoverClosed(1)
    ))

  it("keeps a whole range open without closeOnChange", () =>
    story(
      pickerInput({ closeOnChange: false }),
      given(range()),
      message(pick("2024-05-12")),
      message(pick("2024-05-10")),
      isOpen(true)
    ))

  it("drops a half-picked range when it closes", () =>
    story(
      withDefaults,
      given(modelAfter(withDefaults, range(), [pick("2024-05-12")])),
      message(clicked),
      selected([]),
      expectOutMessage([OutMessage.Changed({ value: [] }), OutMessage.Closed()]),
      popoverClosed(1)
    ))

  it("sorts several dates unless sortDates is off, and stays open", () => {
    const several = opened(init({ id: "input", today, type: "multiple", value: ["2024-05-20"] }))
    step(several, pick("2024-05-02"), {}, selected(["2024-05-02", "2024-05-20"]), isOpen(true))
    step(several, pick("2024-05-02"), { sortDates: false }, selected(["2024-05-20", "2024-05-02"]))
  })

  it("passes calendar paging through and clears", () => {
    const valued = init({ id: "input", today, value: ["2024-05-12"] })
    step(
      valued,
      Message.GotPicker({ message: Picker.Message.GotCalendar({ message: Calendar.Message.Next() }) }),
      {},
      model((current) => expect(current.picker.calendar.date).toBe("2024-06-01")),
      expectNoOutMessage()
    )
    step(
      valued,
      Message.Cleared(),
      {},
      model((current) => expect(current).toEqual(setValue(valued, []))),
      expectOutMessage([OutMessage.Changed({ value: [] })])
    )
  })
})

describe("formatted values, as Mantine's defaultDateFormatter", () => {
  const format = { locale: "en", format: "MMMM D, YYYY", labelSeparator: "–" }

  it("writes the hidden form value as Mantine's HiddenDatesInput", () => {
    expect(hiddenValue("default", ["2024-05-09"])).toBe("2024-05-09")
    expect(hiddenValue("multiple", ["2024-05-09", "2024-05-10"])).toBe("2024-05-09, 2024-05-10")
    expect(hiddenValue("range", [])).toBe("")
    expect(hiddenValue("range", ["2024-05-09"])).toBe("2024-05-09 –")
    expect(hiddenValue("range", ["2024-05-09", "2024-05-10"])).toBe("2024-05-09 – 2024-05-10")
  })

  it("formats one date, several or a range", () => {
    expect(defaultDateFormatter({ ...format, type: "default", value: [] })).toBe("")
    expect(defaultDateFormatter({ ...format, type: "default", value: ["2024-05-09"] })).toBe("May 9, 2024")
    expect(defaultDateFormatter({ ...format, type: "multiple", value: ["2024-05-09", "2024-06-01"] })).toBe(
      "May 9, 2024, June 1, 2024"
    )
    expect(defaultDateFormatter({ ...format, type: "range", value: [] })).toBe("")
    expect(defaultDateFormatter({ ...format, type: "range", value: ["2024-05-09"] })).toBe("May 9, 2024 – ")
    expect(defaultDateFormatter({ ...format, type: "range", value: ["2024-05-09", "2024-05-12"] })).toBe(
      "May 9, 2024 – May 12, 2024"
    )
  })
})
