import { describe, expect, it } from "@effect/vitest"
import { Array as Arr, Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { CarouselCommandMessage, FocusIndicator, Wait } from "./commands.ts"
import {
  canScrollNext,
  canScrollPrevious,
  focusedIndicator,
  indicatorId,
  init,
  Message,
  next,
  OutMessage,
  previous,
  scrollToSlide,
  settled,
  slideCount,
  update
} from "./model.ts"
import type { CarouselContext, Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const layout = {
  view: 300,
  endGap: 0,
  slides: Array.from({ length: 4 }, (_, index) => ({ start: index * 300, size: 300 }))
}

const empty = init({ id: "c" })

const carousel = (context: CarouselContext = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const measured = (context: CarouselContext = {}) => modelAfter(carousel(context), empty, [Message.Measured({ layout })])

const slid = Command.resolveAll([Wait, CarouselCommandMessage.Waited()])

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const index = (expected: number) => model<Model>((current) => expect(current.index).toBe(expected))

const unchanged = (from: Model, sent: Message) =>
  story(
    withDefaults,
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    Command.expectNone()
  )

const step = (from: Model, sent: Message, context: CarouselContext, ...steps: ReadonlyArray<Step>) =>
  story(carousel(context), given(from), message(sent), ...steps)

const pressed = (key: string, at = 0, vertical = false) => Message.PressedIndicatorKey({ index: at, key, vertical })

const focusedAndSlid = Command.resolveAll(
  [Wait, CarouselCommandMessage.Waited()],
  [FocusIndicator, CarouselCommandMessage.Focused()]
)

describe("carousel state, as Mantine's Carousel over embla", () => {
  it("does nothing until measured", () => {
    unchanged(empty, next())
    unchanged(empty, Message.DragEnded({ velocity: 0, pointer: "mouse" }))
    expect(canScrollNext(empty)).toBe(false)
    expect(canScrollPrevious(empty)).toBe(false)
    expect(slideCount(empty)).toBe(0)
  })

  it("starts at the initial slide and keeps its place when measured again", () => {
    const first = measured({ initialSlide: 2 })
    expect(first).toMatchObject({ index: 2, location: -600, animating: false })
    expect(slideCount(first)).toBe(4)
    step({ ...first, index: 3 }, Message.Measured({ layout }), {}, has({ index: 3, location: -900 }))
  })

  it("moves to the next slide and settles there", () =>
    story(
      withDefaults,
      given(measured()),
      message(next()),
      has({ index: 1, location: -300, animating: true, generation: 1 }),
      expectOutMessage([OutMessage.SlideChanged({ index: 1 }), OutMessage.NextSlide()]),
      Command.expectExact(Wait),
      slid,
      has({ animating: false }),
      message(previous()),
      index(0),
      slid
    ))

  it("reports a request for the previous slide at the start", () =>
    step(measured(), previous(), {}, expectOutMessage([OutMessage.PreviousSlide()]), slid))

  it("knows when it can move", () => {
    const start = measured()
    expect(canScrollPrevious(start)).toBe(false)
    expect(canScrollNext(start)).toBe(true)
    expect(canScrollNext({ ...start, index: 3 })).toBe(false)
    expect(canScrollPrevious({ ...start, index: 3 })).toBe(true)
  })

  it("wraps around when looping and settles back inside the loop", () =>
    story(
      carousel({ loop: true }),
      given(measured({ loop: true })),
      message(previous()),
      has({ index: 3, location: 300 }),
      slid,
      has({ location: -900, animating: false })
    ))

  it("ignores a settle from an older move", () => {
    const back = modelAfter(carousel({ loop: true }), measured({ loop: true }), [previous()])
    step(
      back,
      Message.Settled({ generation: 0 }),
      { loop: true },
      model((current) => expect(current).toEqual(back))
    )
  })

  it("loops all the way round", () => {
    const context = { loop: true }
    const start = measured(context)
    expect(canScrollNext(start, context)).toBe(true)
    expect(canScrollPrevious(start, context)).toBe(true)
    story(carousel(context), given(start), ...Arr.makeBy(4, () => [message(next()), slid] as const).flat(), index(0))
  })

  it("scrolls to a slide", () => {
    step(measured(), scrollToSlide(3), {}, has({ index: 3, location: -900 }), slid)
    step(measured(), scrollToSlide(9), {}, index(3), slid)
  })

  it("follows a drag and flicks to the next slide on release", () =>
    story(
      withDefaults,
      given(measured()),
      message(Message.DragMoved({ delta: -40 })),
      message(Message.DragMoved({ delta: -100 })),
      has({ location: -100, dragStart: Option.some(0), animating: false }),
      message(Message.DragEnded({ velocity: -1, pointer: "mouse" })),
      has({ index: 1, location: -300, dragStart: Option.none() }),
      slid
    ))

  it("settles a short drag back where it started", () =>
    story(
      withDefaults,
      given(measured()),
      message(Message.DragMoved({ delta: 120 })),
      message(Message.DragEnded({ velocity: 0, pointer: "touch" })),
      has({ index: 0, location: 0 }),
      slid
    ))

  it("moves by indicator keys and focuses the chosen indicator", () => {
    const start = measured()
    step(start, pressed("ArrowRight"), {}, index(1), Command.expectExact(Wait, FocusIndicator), focusedAndSlid)
    step(start, pressed("ArrowRight", 3), {}, index(0), focusedAndSlid)
    step(start, pressed("ArrowLeft"), {}, index(3), focusedAndSlid)
    step(start, pressed("ArrowLeft", 2), {}, index(1), focusedAndSlid)
    step(start, pressed("ArrowDown", 0, true), {}, index(1), focusedAndSlid)
    step(start, pressed("ArrowUp", 1, true), {}, index(0), focusedAndSlid)
    step(start, pressed("End"), {}, index(3), focusedAndSlid)
    step(start, pressed("Home", 2), {}, index(0), focusedAndSlid)
    unchanged(start, pressed("x"))
  })

  it("names and maps its parts and messages", () => {
    const start = measured()
    expect(indicatorId(start, 2)).toBe("c-indicator-2")
    expect(focusedIndicator()).toEqual(Message.FocusedIndicator())
    unchanged(start, focusedIndicator())
    expect(settled(4)()).toEqual(Message.Settled({ generation: 4 }))
    step(start, next(), {}, expectOutMessage([OutMessage.SlideChanged({ index: 1 }), OutMessage.NextSlide()]), slid)
    step(start, Message.DragMoved({ delta: 0 }), {}, expectNoOutMessage())
  })
})
