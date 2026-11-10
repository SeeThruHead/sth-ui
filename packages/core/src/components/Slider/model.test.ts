import { describe, expect, it } from "@effect/vitest"
import * as FoldkitSlider from "@foldkit/ui/slider"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { restrictedValue, SliderOutMessage, updateWith } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, story } = Story

const slider = (value: number) =>
  listingOutMessages((current: FoldkitSlider.Model, sent: FoldkitSlider.Message) =>
    updateWith(current, sent, { value })
  )

const model = FoldkitSlider.init({ id: "slider", min: 0, max: 100, step: 1 })

const marks = [{ value: 0 }, { value: 25 }, { value: 50 }, { value: 100 }]

describe("Slider extras, as Mantine's", () => {
  it("clamps to the domain, rounds to the precision and snaps to marks", () => {
    expect(restrictedValue({ value: 50, domain: [20, 80] }, 90, false)).toBe(80)
    expect(restrictedValue({ value: 50, precision: 1 }, 33.333, false)).toBe(33.3)
    expect(restrictedValue({ value: 50, marks, restrictToMarks: true }, 40, false)).toBe(50)
    expect(restrictedValue({ value: 50, marks, restrictToMarks: true }, 51, true)).toBe(100)
    expect(restrictedValue({ value: 50, marks, restrictToMarks: true }, 49, true)).toBe(25)
    expect(restrictedValue({ value: 100, marks, restrictToMarks: true }, 101, true)).toBe(100)
    expect(restrictedValue({ value: 50, marks: [], restrictToMarks: true }, 42, false)).toBe(42)
    expect(restrictedValue({ value: 50, marks }, 42, false)).toBe(42)
  })

  it("reports the changed value and the end of the change from the keyboard", () =>
    story(
      slider(40),
      given(model),
      message(FoldkitSlider.Message.PressedKeyboardNavigation({ direction: "StepIncrement", value: 40 })),
      expectOutMessage([SliderOutMessage.ChangedValue({ value: 41 }), SliderOutMessage.ChangeEnded({ value: 41 })])
    ))

  it("reports a changed value on press and the end of the change on release", () => {
    story(
      slider(40),
      given(model),
      message(FoldkitSlider.Message.PressedPointer({ value: 30, originValue: 40 })),
      expectOutMessage([SliderOutMessage.ChangedValue({ value: 30 })])
    )
    story(
      slider(30),
      given(modelAfter(slider(40), model, [FoldkitSlider.Message.PressedPointer({ value: 30, originValue: 40 })])),
      message(FoldkitSlider.Message.ReleasedDragPointer()),
      expectOutMessage([SliderOutMessage.ChangeEnded({ value: 30 })])
    )
  })

  it("reports nothing when a drag is cancelled", () =>
    story(slider(30), given(model), message(FoldkitSlider.Message.CancelledDrag()), expectNoOutMessage()))
})
