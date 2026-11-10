import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { init, Message, OutMessage, placementOf, update } from "./model.ts"
import type { FloatingWindowRules, Gesture, Model } from "./model.ts"

const gesture = (kind: "drag" | "resize", overrides: Partial<Gesture> = {}): Gesture => ({
  kind,
  startX: 100,
  startY: 100,
  left: 50,
  top: 40,
  width: 200,
  height: 120,
  viewportWidth: 800,
  viewportHeight: 600,
  ...overrides
})

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const floatingWindow = (rules: FloatingWindowRules = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, rules))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const fresh = init({ id: "window" })

const pressed = (kind: "drag" | "resize", overrides: Partial<Gesture> = {}): Model =>
  modelAfter(floatingWindow(), fresh, [Message.Pressed({ gesture: gesture(kind, overrides) })])

const position = (expected: { readonly x: number; readonly y: number }) =>
  model<Model>((current) => expect(current.position).toEqual(Option.some(expected)))

const size = (expected: { readonly width: number; readonly height: number }) =>
  model<Model>((current) => expect(current.size).toEqual(Option.some(expected)))

const moveTo = (from: Model, x: number, y: number, rules: FloatingWindowRules, ...steps: ReadonlyArray<Step>) =>
  story(floatingWindow(rules), given(from), message(Message.MovedPointer({ x, y })), ...steps)

const unchanged = (from: Model, sent: Message) =>
  story(
    withDefaults,
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage()
  )

describe("FloatingWindow model", () => {
  it("places the window once, and setPosition moves it again", () =>
    story(
      withDefaults,
      given(fresh),
      message(Message.Placed({ x: 10, y: 20 })),
      position({ x: 10, y: 20 }),
      expectOutMessage([OutMessage.PositionChanged({ x: 10, y: 20 })]),
      message(Message.Placed({ x: 99, y: 99 })),
      position({ x: 10, y: 20 }),
      message(Message.Unplaced()),
      position({ x: 10, y: 20 }),
      message(Message.Positioned({ x: 99, y: 99 })),
      position({ x: 99, y: 99 })
    ))

  it("starts a drag on press", () =>
    story(
      floatingWindow(),
      given(fresh),
      message(Message.Pressed({ gesture: gesture("drag") })),
      expectOutMessage([OutMessage.DragStarted()])
    ))

  it("drags by the pointer's travel, clamped to the viewport", () => {
    const dragging = pressed("drag")
    moveTo(dragging, 130, 160, {}, position({ x: 80, y: 100 }))
    moveTo(dragging, 2000, 2000, {}, position({ x: 600, y: 480 }))
    moveTo(dragging, -500, -500, {}, position({ x: 0, y: 0 }))
    moveTo(dragging, 2000, 2000, { constrainOffset: 20 }, position({ x: 580, y: 460 }))
    moveTo(dragging, 2000, 2000, { constrainToViewport: false }, position({ x: 1950, y: 1940 }))
    moveTo(dragging, 130, 160, { axis: "x" }, position({ x: 80, y: 40 }))
    moveTo(dragging, 130, 160, { axis: "y" }, position({ x: 50, y: 100 }))
  })

  it("ends a drag or a resize, and ignores pointers without one", () => {
    story(
      withDefaults,
      given(pressed("drag")),
      message(Message.ReleasedPointer()),
      expectOutMessage([OutMessage.DragEnded()])
    )
    story(
      withDefaults,
      given(pressed("resize")),
      message(Message.ReleasedPointer()),
      expectOutMessage([OutMessage.ResizeEnded()])
    )
    unchanged(fresh, Message.ReleasedPointer())
    unchanged(fresh, Message.MovedPointer({ x: 10, y: 10 }))
  })

  it("starts a resize on press", () =>
    story(
      floatingWindow(),
      given(fresh),
      message(Message.Pressed({ gesture: gesture("resize") })),
      expectOutMessage([OutMessage.ResizeStarted()])
    ))

  it("resizes from the corner within the dimensions and the viewport", () => {
    const resizing = pressed("resize")
    const dimensions = { minWidth: 180, maxWidth: 300, minHeight: 100, maxHeight: 200 }
    moveTo(
      resizing,
      150,
      130,
      {},
      size({ width: 250, height: 150 }),
      expectOutMessage([OutMessage.SizeChanged({ width: 250, height: 150 })])
    )
    moveTo(resizing, 1000, 1000, { dimensions }, size({ width: 300, height: 200 }))
    moveTo(resizing, -1000, -1000, { dimensions }, size({ width: 180, height: 100 }))
    moveTo(resizing, 5000, 5000, {}, size({ width: 750, height: 560 }))
    moveTo(resizing, 5000, 5000, { constrainOffset: 10 }, size({ width: 740, height: 550 }))
    moveTo(resizing, 5000, 5000, { constrainToViewport: false }, size({ width: 5100, height: 5020 }))
  })

  it("resizes from the keyboard in steps of 10, within the dimensions", () =>
    story(
      floatingWindow({ dimensions: { initialWidth: 200, initialHeight: 150, maxWidth: 205, minHeight: 145 } }),
      given(fresh),
      message(Message.PressedResizeKey({ key: "ArrowRight" })),
      size({ width: 205, height: 150 }),
      message(Message.PressedResizeKey({ key: "ArrowUp" })),
      size({ width: 205, height: 145 })
    ))

  it("resizes from the keyboard without dimensions, and ignores other keys", () =>
    story(
      withDefaults,
      given(fresh),
      message(Message.PressedResizeKey({ key: "ArrowDown" })),
      size({ width: 0, height: 10 }),
      message(Message.PressedResizeKey({ key: "ArrowLeft" })),
      size({ width: -10, height: 10 }),
      message(Message.PressedResizeKey({ key: "Enter" })),
      size({ width: -10, height: 10 })
    ))

  it("places from any side, falling back to where the window is", () => {
    const box = { left: 30, top: 40, width: 200, height: 100 }
    const viewport = { width: 800, height: 600 }
    expect(placementOf(box, viewport, { left: 10, top: 20 }, {})).toEqual({ x: 10, y: 20 })
    expect(placementOf(box, viewport, { right: 20, bottom: 30 }, {})).toEqual({ x: 580, y: 470 })
    expect(placementOf(box, viewport, {}, {})).toEqual({ x: 30, y: 40 })
    expect(placementOf(box, viewport, { left: -50, top: 900 }, {})).toEqual({ x: 0, y: 500 })
    expect(placementOf(box, viewport, { left: -50 }, { constrainToViewport: false })).toEqual({ x: -50, y: 40 })
  })
})
