import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  edgesOf,
  init,
  Message,
  OutMessage,
  overflowsX,
  overflowsY,
  progressOf,
  scrollFromPointer,
  thumbRatio,
  thumbSize,
  update
} from "./model.ts"
import type { Metrics, Model, ScrollAreaContext } from "./model.ts"
import { HideAfterDelay, ScrollAreaCommandMessage, ScrollViewport } from "./commands.ts"

const metrics = (overrides: Partial<Metrics> = {}): Metrics => ({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 1000,
  scrollWidth: 300,
  clientHeight: 200,
  clientWidth: 300,
  ...overrides
})

const track = { start: 100, size: 200, paddingStart: 2, paddingEnd: 2 }

const sizes = { content: 1000, viewport: 200, track }

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const scrollArea = (context: ScrollAreaContext = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const measuredWith = (overrides: Partial<Metrics> = {}) =>
  modelAfter(scrollArea(), init({ id: "area" }), [Message.Measured({ metrics: metrics(overrides) })])

const entered = modelAfter(scrollArea(), init({ id: "area" }), [Message.EnteredRoot()])

const shown = (expected: boolean) => model<Model>((current) => expect(current.shown).toBe(expected))

const scrollingTo =
  (axis: "x" | "y", position: number) =>
  <S extends { readonly commands: ReadonlyArray<{ readonly args?: Record<string, unknown> }> }>(simulation: S): S => {
    expect(simulation.commands.map((command) => command.args)).toEqual([
      { id: "area-viewport", axis, position: expect.closeTo(position, 1) }
    ])

    return simulation
  }

const scrolledTo = (axis: "x" | "y", position: number) =>
  Story.steps(scrollingTo(axis, position), Command.resolve(ScrollViewport, ScrollAreaCommandMessage.Scrolled()))

describe("ScrollArea model", () => {
  it("sizes and places the thumb like Mantine", () => {
    expect(thumbRatio(200, 1000)).toBe(0.2)
    expect(thumbRatio(0, 0)).toBe(0)
    expect(thumbSize(sizes)).toBeCloseTo(39.2)
    expect(thumbSize({ content: 100000, viewport: 200, track })).toBe(18)
    expect(scrollFromPointer(100, 0, sizes)).toBeCloseTo(400)
    expect(scrollFromPointer(2 + 10, 10, sizes)).toBe(0)
    expect(
      scrollFromPointer(50, 0, {
        content: 200,
        viewport: 200,
        track: { ...track, size: 0, paddingStart: 0, paddingEnd: 0 }
      })
    ).toBe(0)
    expect(scrollFromPointer(50, 0, { content: 200, viewport: 200, track })).toBe(0)
  })

  it("reads overflow, progress and the edges", () => {
    expect(overflowsY(metrics())).toBe(true)
    expect(overflowsX(metrics())).toBe(false)
    expect(progressOf(metrics({ scrollTop: 400 }), "y")).toBe(0.5)
    expect(progressOf(metrics({ scrollLeft: 50 }), "x")).toBe(0)
    expect(progressOf(metrics({ scrollTop: 9000 }), "y")).toBe(1)
    expect(edgesOf(metrics({ scrollTop: 800 }))).toEqual({ top: false, bottom: true, left: true, right: true })
  })

  it("measures and reports overflow changes after the first measure", () =>
    story(
      scrollArea(),
      given(init({ id: "area" })),
      message(Message.Measured({ metrics: metrics() })),
      expectNoOutMessage(),
      model((current) => expect(current.overflowing).toEqual(Option.some(true))),
      message(Message.Measured({ metrics: metrics({ scrollHeight: 200 }) })),
      expectOutMessage([OutMessage.OverflowChanged({ overflowing: false })]),
      message(Message.Measured({ metrics: metrics({ scrollHeight: 200 }) })),
      expectNoOutMessage()
    ))

  it("reports the scroll position and each edge it reaches", () =>
    story(
      scrollArea(),
      given(measuredWith({ scrollWidth: 600 })),
      message(Message.Scrolled({ metrics: metrics({ scrollTop: 800, scrollWidth: 600 }) })),
      expectOutMessage([OutMessage.ScrollPositionChanged({ x: 0, y: 800 }), OutMessage.BottomReached()]),
      message(Message.Scrolled({ metrics: metrics({ scrollTop: 300, scrollWidth: 600, scrollLeft: 300 }) })),
      expectOutMessage([OutMessage.ScrollPositionChanged({ x: 300, y: 300 }), OutMessage.RightReached()]),
      message(Message.Scrolled({ metrics: metrics({ scrollWidth: 600 }) })),
      expectOutMessage([
        OutMessage.ScrollPositionChanged({ x: 0, y: 0 }),
        OutMessage.TopReached(),
        OutMessage.LeftReached()
      ]),
      Command.expectNone()
    ))

  it("shows scrollbars while scrolling and hides them after the delay", () =>
    story(
      scrollArea({ type: "scroll", scrollHideDelay: 500 }),
      given(measuredWith()),
      message(Message.Scrolled({ metrics: metrics({ scrollTop: 10 }) })),
      shown(true),
      Command.expectExact(HideAfterDelay({ delay: 500 })),
      Command.resolve(HideAfterDelay, ScrollAreaCommandMessage.Waited()),
      shown(false)
    ))

  it("stays shown when an older hide arrives", () =>
    story(
      scrollArea({ type: "scroll" }),
      given(
        modelAfter(scrollArea({ type: "scroll" }), measuredWith(), [
          Message.Scrolled({ metrics: metrics({ scrollTop: 10 }) })
        ])
      ),
      message(Message.HideElapsed({ generation: 0 })),
      shown(true)
    ))

  it("shows scrollbars on hover and hides them after leaving", () => {
    story(
      scrollArea(),
      given(init({ id: "area" })),
      message(Message.HoveredScrollbar({ hovered: true })),
      model((current) => expect(current.scrollbarHovered).toBe(true)),
      message(Message.HoveredScrollbar({ hovered: false })),
      model((current) => expect(current.scrollbarHovered).toBe(false)),
      message(Message.EnteredRoot()),
      shown(true),
      message(Message.LeftRoot()),
      Command.expectExact(HideAfterDelay({ delay: 1000 })),
      Command.resolve(HideAfterDelay, ScrollAreaCommandMessage.Waited()),
      shown(false)
    )
    story(
      scrollArea({ type: "hover" }),
      given(entered),
      message(Message.LeftRoot()),
      Command.resolve(HideAfterDelay, ScrollAreaCommandMessage.Waited())
    )
    story(
      scrollArea({ type: "auto" }),
      given(entered),
      message(Message.LeftRoot()),
      model((current) => expect(current).toEqual(entered))
    )
  })

  it("drags the thumb to scroll", () =>
    story(
      scrollArea(),
      given(measuredWith()),
      message(Message.PressedScrollbar({ axis: "y", pointer: 200, offset: 0, track })),
      scrolledTo("y", 400),
      message(Message.MovedPointer({ x: 0, y: 300 })),
      scrolledTo("y", 910.2),
      message(Message.ReleasedPointer()),
      model((current) => expect(current.drag).toEqual(Option.none()))
    ))

  it("drags the horizontal thumb", () =>
    story(
      scrollArea(),
      given(
        modelAfter(scrollArea(), measuredWith(), [
          Message.PressedScrollbar({ axis: "x", pointer: 100, offset: 5, track })
        ])
      ),
      message(Message.MovedPointer({ x: 150, y: 0 })),
      Command.expectExact(ScrollViewport),
      Command.resolve(ScrollViewport, ScrollAreaCommandMessage.Scrolled())
    ))

  it("scrolls with the wheel", () => {
    story(scrollArea(), given(measuredWith()), message(Message.Wheeled({ axis: "y", delta: 40 })), scrolledTo("y", 40))
    story(scrollArea(), given(measuredWith()), message(Message.Wheeled({ axis: "x", delta: 40 })), scrolledTo("x", 40))
  })

  it("does nothing before it is measured or without a drag", () => {
    const blind = init({ id: "area" })
    story(scrollArea(), given(measuredWith()), message(Message.MovedPointer({ x: 0, y: 0 })), Command.expectNone())
    story(
      scrollArea(),
      given(blind),
      message(Message.PressedScrollbar({ axis: "y", pointer: 200, offset: 0, track })),
      Command.expectNone()
    )
    story(scrollArea(), given(blind), message(Message.Wheeled({ axis: "y", delta: 40 })), Command.expectNone())
    story(
      withDefaults,
      given(blind),
      message(Message.CompletedScroll()),
      model((current) => expect(current).toEqual(blind))
    )
  })
})
