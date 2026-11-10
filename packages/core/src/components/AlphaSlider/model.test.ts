import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { fractionAt, handledKeys, init, Message, OutMessage, update, valueAt } from "./model.ts"
import type { ColorSliderContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const colourSlider = (context: ColorSliderContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const keyed = (context: ColorSliderContext, key: string, ...steps: ReadonlyArray<Step>) =>
  story(colourSlider(context), given(init({ id: "hue" })), message(Message.PressedKey({ key })), ...steps)

const dragging = (expected: boolean) => model<Model>((current) => expect(current.dragging).toBe(expected))

const alpha = { value: 0.5, maxValue: 1, round: false, decimals: 2 }

const hue = { value: 180, maxValue: 360, round: true }

const track = { left: 100, width: 200 }

describe("colour slider values", () => {
  it("rounds like Mantine's alpha and hue sliders", () => {
    expect(valueAt(0.123456, alpha)).toBe(0.12)
    expect(valueAt(0.5004, hue)).toBe(180)
    expect(valueAt(0.25, { value: 0, maxValue: 4, round: false })).toBe(1)
    expect(fractionAt(150, track)).toBe(0.25)
    expect(fractionAt(50, track)).toBe(0)
    expect(fractionAt(400, track)).toBe(1)
    expect(fractionAt(10, { left: 0, width: 0 })).toBe(0)
    expect([...handledKeys]).toEqual(["ArrowRight", "ArrowLeft"])
  })
})

describe("colour slider dragging", () => {
  it("starts on press, follows the pointer and ends on release", () =>
    story(
      colourSlider(alpha),
      given(init({ id: "alpha" })),
      message(Message.Pressed({ x: 250, track })),
      dragging(true),
      expectOutMessage([OutMessage.ScrubStarted(), OutMessage.Changed({ value: 0.75 })]),
      message(Message.Moved({ x: 120 })),
      expectOutMessage([OutMessage.Changed({ value: 0.1 })]),
      message(Message.Released()),
      dragging(false),
      expectOutMessage([OutMessage.ChangeEnded({ value: 0.1 }), OutMessage.ScrubEnded()])
    ))

  it("ignores moves and releases without a press", () =>
    story(
      colourSlider(alpha),
      given(init({ id: "alpha" })),
      message(Message.Moved({ x: 120 })),
      expectNoOutMessage(),
      message(Message.Released()),
      expectNoOutMessage()
    ))

  it("steps five percent with the arrow keys", () => {
    keyed(
      hue,
      "ArrowRight",
      expectOutMessage([OutMessage.Changed({ value: 198 }), OutMessage.ChangeEnded({ value: 198 })])
    )
    keyed(
      { ...hue, value: 0 },
      "ArrowLeft",
      expectOutMessage([OutMessage.Changed({ value: 0 }), OutMessage.ChangeEnded({ value: 0 })])
    )
    keyed(hue, "Enter", expectNoOutMessage())
  })
})
