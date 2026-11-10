import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { Message as SliderMessage } from "../AlphaSlider/model.ts"
import { init, Message, OutMessage, saturationKeys, setValue, update } from "./model.ts"
import type { ColorPickerContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const box = { left: 0, top: 0, width: 200, height: 100 }

const picker = (context: ColorPickerContext = {}) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const red = init({ id: "picker", value: "#ff0000" })

const color = (expected: object) => model<Model>((current) => expect(current.color).toMatchObject(expected))

const changed = (value: string) => [OutMessage.Changed({ value }), OutMessage.ChangeEnded({ value })]

const step = (sent: Message, context: ColorPickerContext, ...steps: ReadonlyArray<Step>) =>
  story(picker(context), given(red), message(sent), ...steps)

describe("ColorPicker saturation", () => {
  it("picks saturation and brightness by dragging", () =>
    story(
      picker(),
      given(red),
      message(Message.PressedSaturation({ x: 100, y: 50, box })),
      color({ h: 0, s: 50, v: 50, a: 1 }),
      expectOutMessage([OutMessage.Changed({ value: "#804040" })]),
      message(Message.MovedSaturation({ x: 300, y: -10 })),
      expectOutMessage([OutMessage.Changed({ value: "#ff0000" })]),
      message(Message.ReleasedSaturation()),
      expectOutMessage([OutMessage.ChangeEnded({ value: "#ff0000" })])
    ))

  it("reports the value in the chosen format while dragging", () =>
    story(
      picker({ format: "rgb" }),
      given(modelAfter(picker(), red, [Message.PressedSaturation({ x: 100, y: 50, box })])),
      message(Message.MovedSaturation({ x: 300, y: -10 })),
      expectOutMessage([OutMessage.Changed({ value: "rgb(255, 0, 0)" })])
    ))

  it("ignores moves and releases without a press", () => {
    step(Message.MovedSaturation({ x: 1, y: 1 }), {}, expectNoOutMessage())
    step(Message.ReleasedSaturation(), {}, expectNoOutMessage())
  })

  it("picks full brightness on an unmeasured box, and starts white", () => {
    step(Message.PressedSaturation({ x: 5, y: 5, box: { ...box, width: 0, height: 0 } }), {}, color({ s: 0, v: 100 }))
    expect(init({ id: "white" }).color).toEqual({ h: 0, s: 0, v: 100, a: 1 })
  })

  it("moves with the arrow keys", () => {
    step(Message.PressedSaturationKey({ key: "ArrowLeft" }), {}, expectOutMessage(changed("#ff0d0d")))
    step(Message.PressedSaturationKey({ key: "ArrowDown" }), {}, color({ v: 95 }))
    step(Message.PressedSaturationKey({ key: "ArrowUp" }), {}, color({ v: 100 }))
    step(Message.PressedSaturationKey({ key: "ArrowRight" }), {}, color({ s: 100 }))
    step(Message.PressedSaturationKey({ key: "Enter" }), {}, expectNoOutMessage())
    expect(saturationKeys.has("ArrowUp")).toBe(true)
  })
})

describe("ColorPicker hue, alpha and swatches", () => {
  it("takes hue and alpha from the sliders' keys", () => {
    step(
      Message.GotHue({ message: SliderMessage.PressedKey({ key: "ArrowRight" }) }),
      {},
      color({ h: 18 }),
      expectOutMessage(changed("#ff4d00"))
    )
    step(
      Message.GotAlpha({ message: SliderMessage.PressedKey({ key: "ArrowLeft" }) }),
      { format: "rgba" },
      expectOutMessage(changed("rgba(255, 0, 0, 0.95)"))
    )
  })

  it("drags the hue slider", () =>
    story(
      picker(),
      given(red),
      message(Message.GotHue({ message: SliderMessage.Pressed({ x: 50, track: { left: 0, width: 100 } }) })),
      model((current) => expect(current.hue.dragging).toBe(true)),
      color({ h: 180 }),
      message(Message.GotHue({ message: SliderMessage.Released() })),
      expectOutMessage([OutMessage.ChangeEnded({ value: "#00ffff" })])
    ))

  it("picks swatches", () =>
    step(
      Message.PickedSwatch({ color: "#00f" }),
      { format: "rgb" },
      expectOutMessage([
        OutMessage.Changed({ value: "#00f" }),
        OutMessage.SwatchClicked({ value: "rgb(0, 0, 255)" }),
        OutMessage.ChangeEnded({ value: "rgb(0, 0, 255)" })
      ])
    ))

  it("follows the value unless it is being dragged", () => {
    expect(setValue(red, "#00ff00").color.h).toBe(120)
    expect(setValue(red, "nope")).toBe(red)
    expect(setValue({ ...red, dragging: true }, "#00ff00")).toEqual({ ...red, dragging: true })
  })
})
