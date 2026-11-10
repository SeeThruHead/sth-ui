import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import {
  changeValue,
  init,
  keyValue,
  Message,
  nearestThumb,
  nextMark,
  OutMessage,
  positionOf,
  precisionOf,
  previousMark,
  rangedValue,
  thumbId,
  update
} from "./model.ts"
import type { Model, RangeContext, RangeValue } from "./model.ts"
import { FocusMessage, FocusThumb } from "./focus.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const rangeSlider = (rangeContext: RangeContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, rangeContext))

const box = { left: 100, top: 50, width: 200, height: 20 }

const context: RangeContext = { value: [20, 80] }

const stepped = init({ id: "range", min: 0, max: 100, step: 5 })

const focused = Command.resolve(FocusThumb, FocusMessage.Focused())

const pressing = (
  rangeContext: RangeContext,
  press: { readonly x: number; readonly y: number; readonly box: typeof box; readonly thumb: number | null },
  expected: RangeValue
) =>
  story(
    rangeSlider(rangeContext),
    given(stepped),
    message(Message.PressedTrack(press)),
    expectOutMessage([OutMessage.Changed({ value: expected })]),
    focused
  )

const bounds = { min: 0, max: 100, step: 1 }

describe("RangeSlider model", () => {
  it("snaps positions to the step and finds the nearest thumb", () => {
    expect(precisionOf(1)).toBe(0)
    expect(precisionOf(0.05)).toBe(2)
    expect(changeValue(0.333, bounds, 0)).toBe(33)
    expect(changeValue(0, bounds, 0)).toBe(0)
    expect(changeValue(2, { min: 0, max: 1, step: 0.1 }, 1)).toBe(1)
    expect(positionOf(150, 0, 100)).toBe(100)
    expect(positionOf(25, 0, 100)).toBe(25)
    expect(nearestThumb([20, 80], 30)).toBe(0)
    expect(nearestThumb([20, 80], 60)).toBe(1)
  })

  it("pushes the other thumb to keep minRange, or holds when it may not push", () => {
    expect(rangedValue([20, 80], 30, 0, bounds, {})).toEqual([30, 80])
    expect(rangedValue([20, 80], 75, 0, bounds, {})).toEqual([75, 85])
    expect(rangedValue([20, 80], 75, 0, bounds, { pushOnOverlap: false })).toEqual([20, 80])
    expect(rangedValue([20, 80], 95, 0, bounds, {})).toEqual([20, 100])
    expect(rangedValue([20, 80], 25, 1, bounds, {})).toEqual([15, 25])
    expect(rangedValue([20, 80], 25, 1, bounds, { pushOnOverlap: false })).toEqual([20, 80])
    expect(rangedValue([20, 80], 5, 1, bounds, {})).toEqual([0, 80])
    expect(rangedValue([20, 80], 120, 1, bounds, {})).toEqual([20, 100])
  })

  it("keeps the range within maxRange", () => {
    expect(rangedValue([40, 60], 10, 0, bounds, { maxRange: 30 })).toEqual([10, 40])
    expect(rangedValue([40, 60], 10, 0, bounds, { maxRange: 30, pushOnOverlap: false })).toEqual([40, 60])
    expect(rangedValue([40, 60], 90, 1, bounds, { maxRange: 30 })).toEqual([60, 90])
    expect(rangedValue([40, 60], 90, 1, bounds, { maxRange: 30, pushOnOverlap: false })).toEqual([40, 60])
  })

  it("rounds to the step's precision", () => {
    expect(rangedValue([0.2, 0.8], 0.30000000000000004, 0, { min: 0, max: 1, step: 0.1 }, { minRange: 0.2 })).toEqual([
      0.3, 0.8
    ])
  })

  it("moves along marks without stacking the thumbs", () => {
    const marks = [0, 25, 50, 75, 100]
    const rules = { restrictToMarks: true, marks }
    expect(rangedValue([25, 75], 40, 0, bounds, rules)).toEqual([50, 75])
    expect(rangedValue([25, 50], 55, 0, bounds, rules)).toEqual([50, 75])
    expect(rangedValue([50, 75], 45, 1, bounds, rules)).toEqual([25, 50])
    expect(rangedValue([75, 100], 100, 0, bounds, rules)).toEqual([75, 100])
    expect(rangedValue([0, 25], 0, 1, bounds, rules)).toEqual([0, 25])
    expect(rangedValue([25, 50], 90, 0, bounds, rules)).toEqual([50, 100])
    expect(nextMark(100, marks)).toBe(100)
    expect(previousMark(0, marks)).toBe(0)
    expect(previousMark(30, [50, 25, 0])).toBe(25)
  })

  it("steps from the keyboard, by step or by mark", () => {
    const at: RangeValue = [20, 80]
    expect(keyValue("ArrowRight", at, 0, bounds, {})).toEqual(Option.some([21, 80]))
    expect(keyValue("ArrowDown", at, 1, bounds, {})).toEqual(Option.some([20, 79]))
    expect(keyValue("ArrowUp", [20, 100], 1, bounds, {})).toEqual(Option.some([20, 100]))
    expect(keyValue("ArrowLeft", at, 0, bounds, { domain: [10, 90] })).toEqual(Option.some([19, 80]))
    expect(keyValue("ArrowRight", at, 0, bounds, { restrictToMarks: true, marks: [20, 40, 80] })).toEqual(
      Option.some([40, 80])
    )
    expect(keyValue("ArrowLeft", at, 0, bounds, { restrictToMarks: true, marks: [10, 20, 80] })).toEqual(
      Option.some([10, 80])
    )
    expect(keyValue("Enter", at, 0, bounds, {})).toEqual(Option.none())
  })

  it("presses the track, focuses the nearest thumb and drags it", () =>
    story(
      rangeSlider(context),
      given(init({ id: "range" })),
      message(Message.PressedTrack({ x: 240, y: 60, box, thumb: null })),
      model((current) => expect(current.drag).toEqual(Option.some({ thumb: 1, box }))),
      expectOutMessage([OutMessage.Changed({ value: [20, 70] })]),
      Command.expectExact(FocusThumb({ id: "range-thumb-1" })),
      Command.resolve(FocusThumb, FocusMessage.Focused()),
      message(Message.MovedPointer({ x: 300, y: 60 })),
      expectOutMessage([OutMessage.Changed({ value: [20, 100] })]),
      message(Message.ReleasedPointer()),
      model((current) => expect(current.drag).toEqual(Option.none())),
      expectOutMessage([OutMessage.ChangeEnded({ value: [20, 80] })])
    ))

  it("ignores pointer moves, releases and finished focus without a drag", () => {
    const fresh = init({ id: "range" })
    story(rangeSlider(context), given(fresh), message(Message.ReleasedPointer()), expectNoOutMessage())
    story(rangeSlider(context), given(fresh), message(Message.MovedPointer({ x: 1, y: 1 })), expectNoOutMessage())
    story(
      rangeSlider(context),
      given(fresh),
      message(Message.CompletedFocus()),
      model((current) => expect(current).toEqual(fresh))
    )
    expect(thumbId(fresh, 1)).toBe("range-thumb-1")
  })

  it("presses a given thumb and drags it by the step", () =>
    story(
      rangeSlider(context),
      given(stepped),
      message(Message.PressedTrack({ x: 110, y: 60, box, thumb: 0 })),
      expectOutMessage([OutMessage.Changed({ value: [5, 80] })]),
      focused,
      message(Message.MovedPointer({ x: 150, y: 60 })),
      expectOutMessage([OutMessage.Changed({ value: [25, 80] })])
    ))

  it("presses the second thumb, a vertical track and within the domain", () => {
    pressing(context, { x: 290, y: 60, box, thumb: 1 }, [20, 95])
    pressing(
      { ...context, vertical: true },
      { x: 8, y: 50, box: { left: 0, top: 0, width: 16, height: 200 }, thumb: null },
      [20, 75]
    )
    pressing({ ...context, domain: [10, 90] }, { x: 100, y: 60, box, thumb: 0 }, [10, 80])
  })

  it("steps a thumb from the keyboard", () =>
    story(
      rangeSlider(context),
      given(stepped),
      message(Message.PressedKey({ thumb: 1, key: "ArrowLeft" })),
      expectOutMessage([OutMessage.Changed({ value: [20, 75] }), OutMessage.ChangeEnded({ value: [20, 75] })])
    ))

  it("ignores a disabled slider and keys it does not handle", () => {
    const disabled = { ...context, disabled: true }
    story(
      rangeSlider(disabled),
      given(stepped),
      message(Message.PressedTrack({ x: 100, y: 60, box, thumb: 0 })),
      expectNoOutMessage(),
      Command.expectNone()
    )
    story(
      rangeSlider(disabled),
      given(stepped),
      message(Message.PressedKey({ thumb: 0, key: "ArrowLeft" })),
      expectNoOutMessage()
    )
    story(
      rangeSlider(context),
      given(stepped),
      message(Message.PressedKey({ thumb: 0, key: "Tab" })),
      expectNoOutMessage()
    )
  })
})
