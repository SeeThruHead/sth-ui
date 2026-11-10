import { describe, expect, it } from "@effect/vitest"
import * as Animation from "@foldkit/ui/animation"
import { Array as Arr, Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { transitioned } from "../../testing/transition.ts"
import {
  clean,
  cleanQueue,
  dismissElapsed,
  expanded,
  gotTransition,
  hideNotification,
  init,
  Message,
  OutMessage,
  renderedEntries,
  show,
  timerElapsed,
  update,
  updateNotification,
  visibleEntries
} from "./model.ts"
import type { Entry, Model, NotificationsContext } from "./model.ts"
import { Wait, WaitMessage } from "./wait.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const empty = init({ id: "n" })

const notifications = (context: NotificationsContext = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const after = (messages: ReadonlyArray<Message>, context: NotificationsContext = {}) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), empty, messages)

const entry = (current: Model, id: string): Entry => {
  const found = current.entries.find((item) => item.id === id)
  if (found === undefined) throw new Error(`no ${id}`)

  return found
}

const entryIs = (id: string, expected: object) =>
  model<Model>((current) => expect(entry(current, id)).toMatchObject(expected))

const ids = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.entries.map((item) => item.id)).toEqual(expected))

const running = (expected: ReadonlyArray<boolean>) =>
  model<Model>((current) => expect(current.entries.map((item) => item.running)).toEqual(expected))

const shows = (...names: ReadonlyArray<string>) => names.map((id) => show({ id, message: id }))

const waited = (count: number) => Command.resolveAll(...Arr.makeBy(count, () => [Wait, WaitMessage.Waited()] as const))

const transitionsOf = (count: number, generation: number) =>
  Command.resolveAll(
    ...Arr.makeBy(
      count,
      () => [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation })] as const
    ),
    ...Arr.makeBy(
      count,
      () => [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation })] as const
    )
  )

const unchanged = (from: Model, sent: Message, context: NotificationsContext = {}) =>
  story(
    notifications(context),
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage()
  )

describe("notifications state, as Mantine's notifications store and container", () => {
  it("shows with a counted id and closes when its auto close timer runs out", () =>
    story(
      notifications(),
      given(empty),
      message(show({ message: "Saved" })),
      expectOutMessage([OutMessage.Opened({ id: "n-0" })]),
      entryIs("n-0", { message: "Saved", running: true, timer: 1 }),
      Command.expectHas(Wait),
      transitioned(1),
      Command.resolve(Wait, WaitMessage.Waited()),
      transitioned(2),
      ids([])
    ))

  it("ignores a repeated id", () =>
    unchanged(after([show({ id: "n-0", message: "Saved" })]), show({ id: "n-0", message: "again" })))

  it("does not start a timer when auto close is off", () => {
    story(
      notifications(),
      given(empty),
      message(show({ id: "m", message: "Stay", autoClose: false })),
      entryIs("m", { running: false }),
      transitioned(1)
    )
    story(
      notifications({ autoClose: false }),
      given(empty),
      message(show({ id: "o", message: "Stay" })),
      entryIs("o", { running: false }),
      transitioned(1)
    )
  })

  it("queues past the limit and shows the next when one leaves", () => {
    const context = { limit: 2 }
    story(
      notifications(context),
      given(after(shows("a", "b"), context)),
      message(show({ id: "c", message: "c" })),
      model((current) => expect(visibleEntries(current, context).map((item) => item.id)).toEqual(["a", "b"])),
      entryIs("c", { transition: { isShowing: false } }),
      message(hideNotification("a")),
      expectOutMessage([OutMessage.Closed({ id: "a" }), OutMessage.Opened({ id: "c" })]),
      entryIs("a", { running: false, closing: true }),
      entryIs("c", { transition: { isShowing: true } }),
      model((current) => expect(renderedEntries(current, context).map((item) => item.id)).toEqual(["a", "b", "c"])),
      Command.resolveAll(
        [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation: 2 })],
        [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation: 2 })],
        [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation: 1 })],
        [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation: 1 })]
      ),
      ids(["b", "c"]),
      expectNoOutMessage(),
      Command.resolve(Wait, WaitMessage.Waited()),
      transitionsOf(1, 2),
      ids(["b"])
    )
  })

  it("ignores hiding a notification that is already leaving", () => {
    const context = { limit: 2 }
    unchanged(after([...shows("a", "b", "c"), hideNotification("a")], context), hideNotification("a"), context)
  })

  it("drops a queued notification at once when it is hidden", () => {
    const context = { limit: 2 }
    const queued = after(shows("a", "b", "c"), context)
    story(
      notifications(context),
      given(queued),
      message(hideNotification("c")),
      ids(["a", "b"]),
      expectOutMessage([OutMessage.Closed({ id: "c" })])
    )
    unchanged(queued, hideNotification("x"), context)
    unchanged(queued, Message.GotTransition({ id: "x", message: { _tag: "EndedAnimation", generation: 0 } }))
  })

  it("closes when its own timer elapses, not a stale one", () => {
    const one = after(shows("a"))
    unchanged(one, Message.TimerElapsed({ id: "a", timer: 0 }))
    story(
      notifications(),
      given(one),
      message(Message.TimerElapsed({ id: "a", timer: 1 })),
      expectOutMessage([OutMessage.Closed({ id: "a" })]),
      transitioned(1)
    )
  })

  it("pauses every timer while one is hovered, and restarts them all when it leaves", () =>
    story(
      notifications(),
      given(after(shows("a", "b"))),
      message(Message.HoverStarted({ id: "a" })),
      running([false, false]),
      message(show({ id: "c", message: "c" })),
      entryIs("c", { running: false }),
      transitioned(1),
      message(Message.HoverEnded({ id: "a" })),
      running([true, true, true]),
      Command.expectExact(Wait, Wait, Wait),
      Command.resolveAll(...Arr.makeBy(3, () => [Wait, WaitMessage.Waited()] as const)),
      transitionsOf(3, 2)
    ))

  it("pauses only the hovered notification's timer when asked to", () =>
    story(
      notifications({ pauseResetOnHover: "notification" }),
      given(after(shows("a", "b"))),
      message(Message.HoverStarted({ id: "a" })),
      running([false, true])
    ))

  it("leaves a closing notification's timer stopped when another is hovered", () =>
    story(
      notifications(),
      given(after([...shows("a", "b"), hideNotification("b")])),
      message(Message.HoverStarted({ id: "a" })),
      entryIs("b", { running: false })
    ))

  it("updates a notification in place and restarts its timer", () => {
    const loading = after([show({ id: "a", message: "Loading", loading: true, autoClose: false })])
    story(
      notifications(),
      given(loading),
      message(updateNotification({ id: "a", message: "Done", loading: false, autoClose: 2000 })),
      entryIs("a", { message: "Done", loading: false, running: true }),
      waited(1),
      transitioned(1)
    )
    unchanged(loading, Message.Updated({ notification: { message: "x" } }))
  })

  it("cleans only the queue", () => {
    const context = { limit: 1 }
    story(notifications(context), given(after(shows("a", "b"), context)), message(cleanQueue()), ids(["a"]))
  })

  it("cleans everything, once", () => {
    const context = { limit: 1 }
    story(
      notifications(context),
      given(after(shows("a", "b"), context)),
      message(clean()),
      expectOutMessage([OutMessage.Closed({ id: "a" }), OutMessage.Closed({ id: "b" })]),
      ids(["a"]),
      transitionsOf(1, 2),
      ids([])
    )
    story(
      notifications(context),
      given(after([...shows("a", "b"), clean()], context)),
      message(clean()),
      expectNoOutMessage(),
      ids(["a"])
    )
  })

  it("springs back when a swipe stops short", () =>
    story(
      notifications(),
      given(after(shows("a"))),
      message(Message.DragMoved({ id: "a", offset: 30 })),
      entryIs("a", { dragging: true, offset: 30, running: false }),
      message(Message.DragEnded({ id: "a", movement: 30, velocity: 0, width: 400 })),
      entryIs("a", { dragging: false, offset: 0, running: true }),
      waited(1),
      transitioned(1)
    ))

  it("swipes away past the threshold, then closes", () =>
    story(
      notifications({ transitionDuration: 100 }),
      given(after([...shows("a"), Message.DragMoved({ id: "a", offset: 30 })])),
      message(Message.DragEnded({ id: "a", movement: -200, velocity: 0, width: 400 })),
      entryIs("a", { dismissed: true, offset: -440 }),
      Command.expectExact(Wait),
      Command.resolve(Wait, WaitMessage.Waited()),
      expectOutMessage([OutMessage.Closed({ id: "a" })]),
      transitioned(1)
    ))

  it("swipes away to the right", () =>
    story(
      notifications(),
      given(after([...shows("a"), Message.DragMoved({ id: "a", offset: 30 })])),
      message(Message.DragEnded({ id: "a", movement: 300, velocity: 0, width: 400 })),
      entryIs("a", { offset: 440 }),
      Command.resolve(Wait, WaitMessage.Waited()),
      transitioned(1)
    ))

  it("expands a stack while hovered or pinned", () => {
    const one = after([show({ id: "a", message: "a", position: "top-left" })])
    expect(expanded(one, "top-left")).toBe(false)
    story(
      notifications(),
      given(one),
      message(Message.GroupHovered({ position: "top-left", hovered: true })),
      model((current) => expect(expanded(current, "top-left")).toBe(true)),
      message(Message.GroupHovered({ position: "top-right", hovered: true })),
      model((current) => expect(current.groupHovered).toEqual(["top-left", "top-right"])),
      message(Message.GroupHovered({ position: "top-right", hovered: false })),
      message(Message.GroupHovered({ position: "top-left", hovered: false })),
      model((current) => expect(current.groupHovered).toEqual([]))
    )
    story(
      notifications(),
      given(one),
      message(Message.Pinned({ position: Option.some("top-left") })),
      model((current) => expect(expanded(current, "top-left")).toBe(true))
    )
  })

  it("expands the stack of a hovered notification only", () => {
    story(
      notifications(),
      given(after([show({ id: "a", message: "a", position: "top-left" })])),
      message(Message.HoverStarted({ id: "a" })),
      model((current) => expect(expanded(current, "top-left")).toBe(true)),
      model((current) => expect(expanded(current, "bottom-right")).toBe(false))
    )
    story(
      notifications(),
      given(after(shows("b"))),
      message(Message.HoverStarted({ id: "b" })),
      model((current) => expect(expanded(current, "bottom-right")).toBe(true))
    )
  })

  it("maps waits and transitions to its Messages, and defaults its context", () => {
    expect(timerElapsed("a", 2)()).toEqual(Message.TimerElapsed({ id: "a", timer: 2 }))
    expect(dismissElapsed("a")()).toEqual(Message.DismissElapsed({ id: "a" }))
    const inner = { _tag: "EndedAnimation" as const, generation: 1 }
    expect(gotTransition("a")(inner)).toEqual(Message.GotTransition({ id: "a", message: inner }))
    const one = after(shows("a"))
    expect(visibleEntries(one).map((item) => item.id)).toEqual(["a"])
    expect(renderedEntries(one).map((item) => item.id)).toEqual(["a"])
  })

  it("remembers measured heights", () =>
    story(
      withDefaults,
      given(after(shows("a"))),
      message(Message.Measured({ id: "a", height: 72 })),
      entryIs("a", { height: Option.some(72) })
    ))
})
