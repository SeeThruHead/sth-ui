import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { transitioned } from "../../testing/transition.ts"
import * as Animation from "@foldkit/ui/animation"
import { CarouselCommandMessage, Wait } from "../Carousel/commands.ts"
import * as Carousel from "../Carousel/model.ts"
import { Download, EnterFullscreen, ExitFullscreen, LightboxCommandMessage } from "./commands.ts"
import {
  canNext,
  canPrevious,
  carouselContext,
  close,
  completedCommand,
  gotCarousel,
  init,
  isOpened,
  Message,
  open,
  OutMessage,
  update
} from "./model.ts"
import type { LightboxContext, Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const context: LightboxContext = { slideCount: 3, withZoom: true, withThumbnails: true, withFullscreen: true }

const plain: LightboxContext = { slideCount: 3 }

const layout = { view: 400, endGap: 0, slides: [0, 1, 2].map((index) => ({ start: index * 400, size: 400 })) }

const empty = init({ id: "lb", withThumbnails: true })

const lightbox = (options: LightboxContext = context) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const measuredMessage = gotCarousel(Carousel.Message.Measured({ layout }))

const after = (messages: ReadonlyArray<Message>, from: Model = empty) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), from, [
    open(),
    measuredMessage,
    ...messages
  ])

const imageMeasured = Message.MeasuredImage({ size: { width: 400, height: 200 } })

const zoomedIn = [imageMeasured, Message.ToggledZoom()]

const key = (pressed: string) => Message.PressedKey({ key: pressed })

const index = (expected: number) => model<Model>((current) => expect(current.index).toBe(expected))

const zoom = (expected: object) => model<Model>((current) => expect(current.zoom).toEqual(expected))

const unchanged = (from: Model, sent: Message, options: LightboxContext = context) =>
  story(
    lightbox(options),
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    Command.expectNone()
  )

const done = LightboxCommandMessage.Done()

const wheel = (deltaY: number) => Message.Wheeled({ deltaY, offsetX: 0, offsetY: 0 })

const slid = Command.resolveAll([Wait, CarouselCommandMessage.Waited()])

describe("lightbox state, as Mantine's LightboxRoot", () => {
  it("opens at a clamped index", () =>
    story(
      lightbox(),
      given(empty),
      message(open(7)),
      expectOutMessage([OutMessage.LightboxOpened()]),
      index(2),
      model((current) => expect(isOpened(current)).toBe(true)),
      transitioned(1),
      message(measuredMessage),
      model((current) => expect(current.carousel.index).toBe(2))
    ))

  it("closes, resetting zoom and thumbnails", () =>
    story(
      lightbox(),
      given({ ...after(zoomedIn), thumbnailsVisible: false }),
      message(close()),
      expectOutMessage([OutMessage.LightboxClosed()]),
      model((current) => expect(current).toMatchObject({ zoom: { scale: 1 }, thumbnailsVisible: true })),
      transitioned(2)
    ))

  it("starts without thumbnails and builds the carousel's context", () => {
    expect(init({ id: "x" }).thumbnailsVisible).toBe(false)
    expect(carouselContext({ slideCount: 1, withSlideTransition: true })).toEqual({ loop: false, duration: 300 })
  })

  it("moves between slides and reports the index", () =>
    story(
      lightbox(),
      given(after([])),
      message(Message.RequestedNext()),
      index(1),
      expectOutMessage([OutMessage.IndexChanged({ index: 1 })]),
      slid,
      message(Message.RequestedPrevious()),
      index(0),
      slid,
      message(Message.RequestedSlide({ index: 2 })),
      index(2),
      slid
    ))

  it("knows when it can move", () => {
    const start = after([])
    expect(canPrevious(start, context)).toBe(false)
    expect(canNext(start, context)).toBe(true)
    expect(canNext({ ...start, index: 2 }, context)).toBe(false)
    expect(canPrevious(start, { ...context, loop: true })).toBe(true)
    expect(canNext(start, { slideCount: 1, loop: true })).toBe(false)
  })

  it("answers the keyboard like useLightboxKeyboard", () =>
    story(
      lightbox(),
      given(after([])),
      message(key("ArrowRight")),
      index(1),
      slid,
      message(key("ArrowLeft")),
      index(0),
      slid,
      message(key("t")),
      model((current) => expect(current.thumbnailsVisible).toBe(false)),
      message(key("z")),
      model((current) => expect(current.zoom.scale).toBe(2)),
      message(key("f")),
      Command.expectExact(EnterFullscreen),
      Command.resolve(EnterFullscreen, done),
      message(key("Escape")),
      expectOutMessage([OutMessage.LightboxClosed()]),
      Command.resolve(ExitFullscreen, done),
      transitioned(2)
    ))

  it("ignores keys it does not handle or that are turned off", () => {
    const start = after([])
    unchanged(empty, key("Escape"))
    unchanged(start, key("ArrowUp"))
    unchanged(start, key("q"))
    unchanged(start, key("ArrowRight"), { ...context, withKeyboardEvents: false })
    unchanged(start, key("T"), plain)
    unchanged(start, key("f"), plain)
    story(lightbox(plain), given(start), message(key("z")), zoom({ scale: 1, x: 0, y: 0 }))
  })

  it("pans a zoomed image with the arrow keys", () => {
    const big = after(zoomedIn)
    const pans = (pressed: string, expected: object) =>
      story(lightbox(), given(big), message(key(pressed)), zoom(expected))
    pans("ArrowLeft", { scale: 2, x: 50, y: 0 })
    pans("ArrowRight", { scale: 2, x: -50, y: 0 })
    pans("ArrowUp", { scale: 2, x: 0, y: 50 })
    pans("ArrowDown", { scale: 2, x: 0, y: -50 })
  })

  it("pans a zoomed image by dragging, and remembers the drag until zoom changes", () =>
    story(
      lightbox(),
      given(after(zoomedIn)),
      message(Message.PanStarted({ x: 100, y: 100 })),
      message(Message.PanMoved({ x: 130, y: 90 })),
      zoom({ scale: 2, x: 30, y: -10 }),
      message(Message.PanEnded()),
      model((current) => expect(Option.isSome(current.pan)).toBe(true)),
      message(Message.ToggledZoom()),
      model((current) => expect(current).toMatchObject({ zoom: { scale: 2 }, pan: Option.none() }))
    ))

  it("treats a drag that barely moved as a tap", () =>
    story(
      lightbox(),
      given(after([...zoomedIn, Message.PanStarted({ x: 100, y: 100 })])),
      message(Message.PanMoved({ x: 101, y: 100 })),
      message(Message.PanEnded()),
      model((current) => expect(current.pan).toEqual(Option.none()))
    ))

  it("does not pan an image that is not zoomed, or without a drag", () => {
    story(
      lightbox(),
      given(after([])),
      message(Message.PanStarted({ x: 0, y: 0 })),
      model((current) => expect(current.pan).toEqual(Option.none()))
    )
    unchanged(after(zoomedIn), Message.PanMoved({ x: 1, y: 1 }))
  })

  it("zooms with the wheel unless zoom is off", () => {
    const big = after(zoomedIn)
    story(
      lightbox(),
      given(big),
      message(wheel(10)),
      model((current) => expect(current.zoom.scale).toBeCloseTo(1.8))
    )
    story(
      lightbox(),
      given(big),
      message(wheel(-10)),
      model((current) => expect(current.zoom.scale).toBeCloseTo(2.2))
    )
    unchanged(big, wheel(-10), plain)
  })

  it("enters and leaves fullscreen, leaving it on close because it entered it", () =>
    story(
      lightbox(),
      given(after([])),
      message(Message.ToggledFullscreen()),
      Command.expectExact(EnterFullscreen),
      Command.resolve(EnterFullscreen, done),
      message(Message.FullscreenChanged({ fullscreen: true })),
      model((current) => expect(current).toMatchObject({ fullscreen: true, ownsFullscreen: true })),
      message(close()),
      Command.expectHas(ExitFullscreen),
      Command.resolve(ExitFullscreen, done),
      transitioned(2)
    ))

  it("leaves fullscreen when toggled while in it", () =>
    story(
      lightbox(),
      given(after([Message.FullscreenChanged({ fullscreen: true })])),
      message(Message.ToggledFullscreen()),
      Command.expectExact(ExitFullscreen),
      Command.resolve(ExitFullscreen, done)
    ))

  it("leaves fullscreen alone on close when it did not enter it", () =>
    story(lightbox(), given(after([])), message(close()), Command.expectExact(Animation.WaitForPaint), transitioned(2)))

  it("forgets owning fullscreen once the browser leaves it", () =>
    story(
      lightbox(),
      given(after([Message.FullscreenChanged({ fullscreen: true })])),
      message(Message.FullscreenChanged({ fullscreen: false })),
      model((current) => expect(current.ownsFullscreen).toBe(false))
    ))

  it("closes on a downward swipe unless zoomed or turned off", () => {
    story(
      lightbox(),
      given(after([])),
      message(Message.SwipedDown()),
      expectOutMessage([OutMessage.LightboxClosed()]),
      transitioned(2)
    )
    story(lightbox(), given(after(zoomedIn)), message(Message.SwipedDown()), expectNoOutMessage())
    story(
      lightbox({ ...context, closeOnSwipeDown: false }),
      given(after([])),
      message(Message.SwipedDown()),
      expectNoOutMessage()
    )
  })

  it("downloads, toggles thumbnails and ignores finished commands", () => {
    story(
      lightbox(),
      given(after([])),
      message(Message.RequestedDownload({ src: "/a.png" })),
      Command.expectExact(Download),
      Command.resolve(Download, done),
      message(Message.ToggledThumbnails()),
      model((current) => expect(current.thumbnailsVisible).toBe(false))
    )
    unchanged(after([]), completedCommand())
  })

  it("maps carousel messages", () =>
    expect(gotCarousel(Carousel.next())).toEqual(Message.GotCarousel({ message: Carousel.next() })))
})
