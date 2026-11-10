import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  angleAt,
  findClosestNumber,
  init,
  keyValue,
  Message,
  normalizeRadialValue,
  OutMessage,
  update
} from "./model.ts"
import type { AngleSliderContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const angleSlider = (context: AngleSliderContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const center = { x: 100, y: 100 }

const pressed = modelAfter(angleSlider({ value: 0 }), init({ id: "angle" }), [
  Message.Pressed({ x: 150, y: 100, center })
])

describe("AngleSlider math, as Mantine's", () => {
  it("measures the angle clockwise from the top", () => {
    expect(angleAt({ x: 100, y: 50 }, center)).toBeCloseTo(0)
    expect(angleAt({ x: 150, y: 100 }, center)).toBeCloseTo(90)
    expect(angleAt({ x: 100, y: 150 }, center)).toBeCloseTo(180)
    expect(angleAt({ x: 50, y: 100 }, center)).toBeCloseTo(270)
  })

  it("normalizes to the step and finds the closest mark", () => {
    expect(normalizeRadialValue(359.6, 1)).toBe(0)
    expect(normalizeRadialValue(44.2, 1)).toBe(45)
    expect(normalizeRadialValue(44.2, 15)).toBe(45)
    expect(normalizeRadialValue(10.123, 0.5)).toBe(10.5)
    expect(normalizeRadialValue(-5, 1)).toBe(0)
    expect(findClosestNumber(100, [0, 90, 180])).toBe(90)
    expect(findClosestNumber(5, [])).toBe(5)
  })

  it("steps with the keyboard and wraps around", () => {
    expect(keyValue("ArrowRight", { value: 10 })).toBe(11)
    expect(keyValue("ArrowUp", { value: 359 })).toBe(0)
    expect(keyValue("ArrowLeft", { value: 0 })).toBe(359)
    expect(keyValue("ArrowDown", { value: 30, step: 15 })).toBe(15)
    expect(keyValue("Home", { value: 30 })).toBe(0)
    expect(keyValue("End", { value: 30 })).toBe(359)
    expect(keyValue("Enter", { value: 30 })).toBe(30)
    const marks = [0, 90, 180, 270]
    expect(keyValue("ArrowRight", { value: 90, marks, restrictToMarks: true })).toBe(180)
    expect(keyValue("ArrowRight", { value: 270, marks, restrictToMarks: true })).toBe(0)
    expect(keyValue("ArrowLeft", { value: 0, marks, restrictToMarks: true })).toBe(270)
    expect(keyValue("ArrowLeft", { value: 180, marks, restrictToMarks: true })).toBe(90)
    expect(keyValue("End", { value: 90, marks, restrictToMarks: true })).toBe(270)
    expect(keyValue("ArrowRight", { value: 100, marks, restrictToMarks: true })).toBe(90)
    expect(keyValue("ArrowRight", { value: 10, marks })).toBe(11)
  })
})

describe("AngleSlider updates", () => {
  const fresh = init({ id: "angle" })

  it("drags around the centre", () =>
    story(
      angleSlider({ value: 0 }),
      given(fresh),
      message(Message.Pressed({ x: 150, y: 100, center })),
      expectOutMessage([OutMessage.Changed({ value: 90 }), OutMessage.ScrubStarted()]),
      message(Message.Moved({ x: 100, y: 150 })),
      expectOutMessage([OutMessage.Changed({ value: 180 })])
    ))

  it("ends the drag on release with the last value", () =>
    story(
      angleSlider({ value: 180 }),
      given(pressed),
      message(Message.Released()),
      expectOutMessage([OutMessage.ChangeEnded({ value: 180 }), OutMessage.ScrubEnded()]),
      model((current) => expect(current.dragging).toBe(false))
    ))

  it("snaps a drag to the marks when restricted to them", () => {
    story(
      angleSlider({ value: 0, marks: [0, 90, 180, 270], restrictToMarks: true }),
      given(pressed),
      message(Message.Moved({ x: 60, y: 100 })),
      expectOutMessage([OutMessage.Changed({ value: 270 })])
    )
    story(
      angleSlider({ value: 0, restrictToMarks: true, marks: [] }),
      given(fresh),
      message(Message.Pressed({ x: 150, y: 100, center })),
      expectOutMessage([OutMessage.Changed({ value: 90 }), OutMessage.ScrubStarted()])
    )
  })

  it("ignores moves and releases without a press", () =>
    story(
      angleSlider({ value: 0 }),
      given(fresh),
      message(Message.Moved({ x: 1, y: 1 })),
      expectNoOutMessage(),
      message(Message.Released()),
      expectNoOutMessage()
    ))

  it("takes keys and ignores everything while disabled", () => {
    story(
      angleSlider({ value: 5 }),
      given(fresh),
      message(Message.PressedKey({ key: "ArrowUp" })),
      expectOutMessage([OutMessage.Changed({ value: 6 }), OutMessage.ChangeEnded({ value: 6 })])
    )
    story(
      angleSlider({ value: 5, disabled: true }),
      given(fresh),
      message(Message.PressedKey({ key: "ArrowUp" })),
      expectNoOutMessage()
    )
  })
})
