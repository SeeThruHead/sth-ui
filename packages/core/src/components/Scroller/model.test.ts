import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { modelAfter } from "@sth-ui/testing/Story.ts"
import { ScrollBy, ScrollerCommandMessage, ScrollTo } from "./commands.ts"
import { init, Message, scrollState, update } from "./model.ts"
import type { Model, ScrollerContext } from "./model.ts"

const { Command, given, message, model, story } = Story

const scroller =
  (context: ScrollerContext = {}) =>
  (current: Model, sent: Message) =>
    update(current, sent, context)

const fresh = init({ id: "scroller" })

const scrolledBy = (amount: number) =>
  [
    Command.expectExact(ScrollBy({ id: "scroller-container", amount })),
    Command.resolve(ScrollBy, ScrollerCommandMessage.Scrolled())
  ] as const

const unchanged = (from: Model, sent: Message, context: ScrollerContext = {}) =>
  story(
    scroller(context),
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    Command.expectNone()
  )

describe("Scroller", () => {
  it("tracks whether it can scroll either way", () => {
    expect(scrollState({ scrollLeft: 0, scrollWidth: 500, clientWidth: 200, rtl: false })).toEqual({
      canScrollStart: false,
      canScrollEnd: true
    })
    expect(scrollState({ scrollLeft: 300, scrollWidth: 500, clientWidth: 200, rtl: false })).toEqual({
      canScrollStart: true,
      canScrollEnd: false
    })
    expect(scrollState({ scrollLeft: -150, scrollWidth: 500, clientWidth: 200, rtl: true })).toEqual({
      canScrollStart: true,
      canScrollEnd: true
    })
  })

  it("remembers where it scrolled to", () => {
    story(
      (current: Model, sent: Message) => update(current, sent),
      given(fresh),
      message(Message.Scrolled({ canScrollStart: true, canScrollEnd: false, scrollLeft: 40 })),
      model((current) => expect(current).toMatchObject({ canScrollStart: true, canScrollEnd: false, scrollLeft: 40 }))
    )
    unchanged(fresh, Message.CompletedScroll())
  })

  it("scrolls by the scroll amount from the controls", () => {
    story(scroller(), given(fresh), message(Message.PressedEnd()), ...scrolledBy(200))
    story(scroller(), given(fresh), message(Message.PressedStart()), ...scrolledBy(-200))
    story(scroller({ scrollAmount: 50 }), given(fresh), message(Message.PressedEnd()), ...scrolledBy(50))
    story(scroller({ scrollAmount: 300 }), given(fresh), message(Message.PressedStart()), ...scrolledBy(-300))
  })

  it("drags the content", () =>
    story(
      scroller(),
      given({ ...fresh, scrollLeft: 100 }),
      message(Message.Pressed({ x: 50 })),
      model((current) => expect(current.drag).toEqual({ startX: 50, startScroll: 100 })),
      message(Message.Moved({ x: 10 })),
      Command.expectExact(ScrollTo({ id: "scroller-container", left: 140 })),
      Command.resolve(ScrollTo, ScrollerCommandMessage.Scrolled()),
      message(Message.Released()),
      model((current) => expect(current.drag).toBeNull())
    ))

  it("ignores moves and releases without a drag, and presses when not draggable", () => {
    unchanged(fresh, Message.Moved({ x: 1 }))
    unchanged(fresh, Message.Released())
    unchanged(fresh, Message.Pressed({ x: 1 }), { draggable: false })
    expect(modelAfter(scroller(), fresh, [Message.Pressed({ x: 1 })]).drag).not.toBeNull()
  })
})
