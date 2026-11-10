import { describe, expect, it } from "@effect/vitest"
import * as Popover from "@foldkit/ui/popover"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { popoverClosed, popoverOpened } from "../../testing/popover.ts"
import { gotPopover, init, Message, OutMessage, update } from "./model.ts"
import type { ComboboxPopoverContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const options = ["React", "Angular", "Vue"]

const single: ComboboxPopoverContext = { options, value: null }

const combobox = (context: ComboboxPopoverContext = single) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const opened = (): Model => {
  const closed = init({ id: "framework" })

  return { ...closed, popover: Popover.open(closed.popover).model }
}

const after = (messages: ReadonlyArray<Message>, context: ComboboxPopoverContext = single) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), opened(), messages)

const active = (expected: string | null) => model<Model>((current) => expect(current.active).toBe(expected))

const isOpen = (expected: boolean) => model<Model>((current) => expect(current.popover.isOpen).toBe(expected))

const next = Message.Moved({ direction: "next" })

const previous = Message.Moved({ direction: "previous" })

const clicked = Message.GotPopover({ message: Popover.Message.ClickedButton() })

const chose = (value: string) => Message.Chose({ value })

describe("ComboboxPopover, as Mantine's", () => {
  it("moves the active option with wrap-around", () => {
    story(combobox(), given(opened()), message(next), active("React"), message(previous), active("Vue"))
    story(combobox(), given(opened()), message(previous), active("Vue"))
    story(combobox({ ...single, options: [] }), given(opened()), message(next), active(null))
  })

  it("submits a single value and closes", () =>
    story(
      combobox(),
      given(opened()),
      message(chose("Vue")),
      expectOutMessage([
        OutMessage.OptionSubmitted({ value: "Vue" }),
        OutMessage.Changed({ value: "Vue" }),
        OutMessage.Closed()
      ]),
      isOpen(false),
      popoverClosed(1)
    ))

  it("deselects the chosen value, unless told not to", () => {
    story(
      combobox({ ...single, value: "Vue" }),
      given(opened()),
      message(chose("Vue")),
      expectOutMessage([
        OutMessage.OptionSubmitted({ value: "Vue" }),
        OutMessage.Changed({ value: null }),
        OutMessage.Closed()
      ]),
      popoverClosed(1)
    )
    story(
      combobox({ ...single, value: "Vue", allowDeselect: false }),
      given(opened()),
      message(chose("Vue")),
      expectOutMessage([
        OutMessage.OptionSubmitted({ value: "Vue" }),
        OutMessage.Changed({ value: "Vue" }),
        OutMessage.Closed()
      ]),
      popoverClosed(1)
    )
  })

  it("toggles values when multiple and stays open", () => {
    const context = { ...single, multiple: true, value: ["React"] }
    story(
      combobox(context),
      given(opened()),
      message(chose("Vue")),
      expectOutMessage([
        OutMessage.OptionSubmitted({ value: "Vue" }),
        OutMessage.ChangedMany({ value: ["React", "Vue"] })
      ]),
      isOpen(true),
      active("Vue")
    )
    story(
      combobox(context),
      given(opened()),
      message(chose("React")),
      expectOutMessage([OutMessage.OptionSubmitted({ value: "React" }), OutMessage.ChangedMany({ value: [] })])
    )
    story(
      combobox({ ...context, value: null }),
      given(opened()),
      message(chose("Vue")),
      expectOutMessage([OutMessage.OptionSubmitted({ value: "Vue" }), OutMessage.ChangedMany({ value: ["Vue"] })])
    )
  })

  it("searches, resets the search after a choice and submits the active option on Enter", () => {
    const context = { ...single, searchable: true }
    story(
      combobox(context),
      given(opened()),
      message(Message.Searched({ value: "re" })),
      expectOutMessage([OutMessage.SearchChanged({ value: "re" })]),
      message(next),
      message(Message.PressedEnter()),
      model((current) => expect(current.search).toBe("")),
      expectOutMessage([
        OutMessage.OptionSubmitted({ value: "React" }),
        OutMessage.Changed({ value: "React" }),
        OutMessage.Closed(),
        OutMessage.SearchChanged({ value: "" })
      ]),
      popoverClosed(1)
    )
    story(
      combobox(context),
      given(after([Message.Searched({ value: "re" })], context)),
      message(Message.PressedEnter()),
      expectNoOutMessage()
    )
  })

  it("selects the first option when it opens, if asked to, and clears it when it closes", () =>
    story(
      combobox({ ...single, selectFirstOptionOnDropdownOpen: true }),
      given(init({ id: "framework" })),
      message(clicked),
      expectOutMessage([OutMessage.Opened()]),
      active("React"),
      popoverOpened(),
      message(clicked),
      expectOutMessage([OutMessage.Closed()]),
      active(null),
      popoverClosed()
    ))

  it("selects nothing when it opens without being asked to, or with no options", () => {
    story(combobox(), given(init({ id: "framework" })), message(clicked), active(null), popoverOpened())
    story(
      combobox({ options: [], value: null, selectFirstOptionOnDropdownOpen: true }),
      given(init({ id: "framework" })),
      message(clicked),
      active(null),
      popoverOpened()
    )
  })

  it("maps popover messages and ignores those that change nothing", () => {
    expect(gotPopover(Popover.Message.ClickedButton())).toEqual(clicked)
    story(
      combobox(),
      given(init({ id: "framework" })),
      message(Message.GotPopover({ message: Popover.Message.CompletedFocusButton() })),
      expectNoOutMessage()
    )
  })
})
