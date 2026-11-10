import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { transitioned } from "../../testing/transition.ts"
import {
  actionId,
  actionsOf,
  close,
  completedReveal,
  gotModal,
  init,
  isOpened,
  listId,
  Message,
  open,
  OutMessage,
  searchId,
  selectIndex,
  toggle,
  update
} from "./model.ts"
import type { Model, SpotlightContext } from "./model.ts"
import { Reveal, RevealMessage } from "./reveal.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const context: SpotlightContext = {
  actions: [
    { id: "home", label: "Home" },
    { id: "docs", label: "Documentation" },
    { id: "stay", label: "Dashboard", closeSpotlightOnTrigger: false }
  ]
}

const spotlight = (options: SpotlightContext = context) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const empty = init({ id: "spot" })

const opened = init({ id: "spot", opened: true })

const after = (messages: ReadonlyArray<Message>) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), opened, messages)

const selected = (expected: number) => model<Model>((current) => expect(current.selected).toBe(expected))

const isOpen = (expected: boolean) => model<Model>((current) => expect(isOpened(current)).toBe(expected))

const unchanged = (from: Model, sent: Message, options: SpotlightContext = context) =>
  story(
    spotlight(options),
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from))
  )

describe("spotlight state, as Mantine's spotlight store", () => {
  it("names its parts and maps messages", () => {
    expect([actionId(empty, 2), listId(empty), searchId(empty)]).toEqual([
      "spot-action-2",
      "spot-actions",
      "spot-search"
    ])
    expect(gotModal({ _tag: "RequestedClose" })).toEqual(Message.GotModal({ message: { _tag: "RequestedClose" } }))
    expect(completedReveal()).toEqual(Message.CompletedReveal())
    expect(init({ id: "q", opened: true, query: "x" })).toMatchObject({ query: "x" })
    story(
      update,
      given(empty),
      message(completedReveal()),
      model((current) => expect(current).toEqual(empty))
    )
  })

  it("opens and closes, reporting both", () =>
    story(
      spotlight(),
      given(empty),
      message(open()),
      isOpen(true),
      expectOutMessage([OutMessage.SpotlightOpened()]),
      transitioned(1),
      message(toggle()),
      isOpen(false),
      expectOutMessage([OutMessage.SpotlightClosed()]),
      transitioned(2)
    ))

  it("opens on toggle and closes on close", () =>
    story(
      spotlight(),
      given(empty),
      message(toggle()),
      isOpen(true),
      transitioned(1),
      message(close()),
      expectOutMessage([OutMessage.SpotlightClosed()]),
      transitioned(2)
    ))

  it("wraps the selected index, as selectAction", () => {
    expect(selectIndex(-1, 3)).toBe(2)
    expect(selectIndex(3, 3)).toBe(0)
    expect(selectIndex(1, 3)).toBe(1)
    expect(selectIndex(0, 0)).toBe(-1)
  })

  it("selects the next and previous actions and scrolls each into view", () =>
    story(
      spotlight(),
      given(opened),
      message(Message.SelectedNext()),
      selected(0),
      Command.expectExact(Reveal),
      Command.resolve(Reveal, RevealMessage.Revealed()),
      message(Message.SelectedPrevious()),
      selected(2),
      Command.resolve(Reveal, RevealMessage.Revealed())
    ))

  it("selects the first action on the way up from nothing selected", () =>
    story(
      spotlight(),
      given(opened),
      message(Message.SelectedPrevious()),
      selected(0),
      Command.resolveAll([Reveal, RevealMessage.Revealed()])
    ))

  it("selects nothing when no action matches", () =>
    story(
      spotlight(),
      given({ ...opened, query: "zzz" }),
      message(Message.SelectedNext()),
      selected(-1),
      Command.expectNone()
    ))

  it("filters on the query and selects the first action", () =>
    story(
      spotlight(),
      given(opened),
      message(Message.ChangedQuery({ query: "do" })),
      model((current) => expect(current).toMatchObject({ query: "do", selected: 0 })),
      model((current) => expect(actionsOf(current, context).map((action) => action.id)).toEqual(["docs"])),
      expectOutMessage([OutMessage.QueryChanged({ query: "do" })]),
      Command.resolve(Reveal, RevealMessage.Revealed())
    ))

  it("triggers the selected action and closes", () =>
    story(
      spotlight(),
      given(after([Message.SelectedNext()])),
      message(Message.TriggeredSelected()),
      expectOutMessage([OutMessage.ActionTriggered({ id: "home" }), OutMessage.SpotlightClosed()]),
      transitioned(1)
    ))

  it("stays open for an action that asks to", () =>
    story(
      spotlight(),
      given(opened),
      message(Message.ClickedAction({ id: "stay" })),
      expectOutMessage([OutMessage.ActionTriggered({ id: "stay" })]),
      isOpen(true)
    ))

  it("stays open for every action when told not to close", () =>
    story(
      spotlight({ ...context, closeOnActionTrigger: false }),
      given(opened),
      message(Message.ClickedAction({ id: "home" })),
      expectOutMessage([OutMessage.ActionTriggered({ id: "home" })])
    ))

  it("does nothing with no selection or an unknown action", () => {
    unchanged(opened, Message.TriggeredSelected())
    unchanged(opened, Message.ClickedAction({ id: "nope" }))
  })

  it("clears the query and selection once closed", () =>
    story(
      spotlight(),
      given(after([Message.ChangedQuery({ query: "do" })])),
      message(close()),
      transitioned(1),
      model((current) => expect(current).toMatchObject({ query: "", selected: -1 })),
      expectOutMessage([OutMessage.QueryChanged({ query: "" })])
    ))

  it("keeps the query once closed when asked to", () =>
    story(
      spotlight({ ...context, clearQueryOnClose: false }),
      given(after([Message.ChangedQuery({ query: "do" })])),
      message(close()),
      transitioned(1),
      model((current) => expect(current).toMatchObject({ query: "do", selected: -1 })),
      expectNoOutMessage()
    ))

  it("reports no query change when the query was already empty", () =>
    story(spotlight(), given(opened), message(close()), transitioned(1), expectNoOutMessage()))

  it("closes when the modal asks", () =>
    story(
      spotlight(),
      given(opened),
      message(Message.GotModal({ message: { _tag: "RequestedClose" } })),
      expectOutMessage([OutMessage.SpotlightClosed()]),
      transitioned(1)
    ))
})
