import { afterEach, describe, expect, it, vi } from "@effect/vitest"
import { Effect } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { Message as PickerMessage } from "../ColorPicker/model.ts"
import { init, isRemembered, Message, OpenEyeDropper, OutMessage, setValue, update } from "./model.ts"
import type { ColorInputContext, Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const colorInput = (inputContext: ColorInputContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, inputContext))

const red = init({ id: "color", value: "#ff0000", eyeDropperSupported: false })

const open = { ...init({ id: "color", value: "#ff0000" }), opened: true }

const step = (from: Model, sent: Message, inputContext: ColorInputContext, ...steps: ReadonlyArray<Step>) =>
  story(colorInput(inputContext), given(from), message(sent), ...steps)

const opened = (expected: boolean) => model<Model>((current) => expect(current.opened).toBe(expected))

const context = { value: "#ff0000" }

describe("ColorInput typing and blurring", () => {
  it("opens on focus and click", () => {
    expect(red.picker.color.h).toBe(0)
    step(red, Message.Focused(), context, opened(true))
    step(red, Message.Clicked(), context, opened(true))
  })

  it("reports a typed colour and follows it", () =>
    step(
      red,
      Message.Typed({ value: "#00f" }),
      { ...context, format: "rgb" },
      expectOutMessage([OutMessage.Changed({ value: "#00f" }), OutMessage.ChangeEnded({ value: "rgb(0, 0, 255)" })]),
      model((current) => expect(current.lastValidValue).toBe("#00f")),
      model((current) => expect(current.picker.color.h).toBe(240))
    ))

  it("reports a partial colour without remembering it", () =>
    step(
      red,
      Message.Typed({ value: "#00" }),
      context,
      expectOutMessage([OutMessage.Changed({ value: "#00" })]),
      model((current) => expect(current.lastValidValue).toBe("#ff0000"))
    ))

  it("starts without a colour or with an invalid one", () => {
    expect(init({ id: "empty" }).lastValidValue).toBe("")
    expect(init({ id: "empty" }).picker.color).toEqual({ h: 0, s: 0, v: 0, a: 1 })
    expect(init({ id: "bad", value: "nope" }).lastValidValue).toBe("")
    expect(isRemembered("  ")).toBe(true)
  })

  it("puts the last valid value back on blur", () => {
    step(
      open,
      Message.Blurred(),
      { value: "#ff" },
      opened(false),
      expectOutMessage([OutMessage.Changed({ value: "#ff0000" })])
    )
    step(open, Message.Blurred(), { value: "#ff0000" }, expectNoOutMessage())
    step(open, Message.Blurred(), { value: "#ff", fixOnBlur: false }, expectNoOutMessage())
    expect(setValue(open, "#00ff00").picker.color.h).toBe(120)
  })
})

describe("ColorInput picker and eye dropper", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("follows the picker", () =>
    step(
      open,
      Message.GotPicker({ message: PickerMessage.PressedSaturationKey({ key: "ArrowLeft" }) }),
      context,
      expectOutMessage([OutMessage.Changed({ value: "#ff0d0d" }), OutMessage.ChangeEnded({ value: "#ff0d0d" })]),
      model((current) => expect(current.lastValidValue).toBe("#ff0d0d"))
    ))

  it("closes on a swatch only when asked", () => {
    const swatch = Message.GotPicker({ message: PickerMessage.PickedSwatch({ color: "#00f" }) })
    step(open, swatch, context, opened(true))
    step(open, swatch, { ...context, closeOnColorSwatchClick: true }, opened(false))
  })

  it("opens the eye dropper and takes its colour", () =>
    step(
      init({ id: "color", value: "#ff0000" }),
      Message.PressedEyeDropper(),
      { ...context, format: "rgba" },
      Command.expectExact(OpenEyeDropper),
      Command.resolve(OpenEyeDropper, Message.PickedWithEyeDropper({ color: "#00ff00" })),
      expectOutMessage([
        OutMessage.Changed({ value: "rgba(0, 255, 0, 1)" }),
        OutMessage.ChangeEnded({ value: "rgba(0, 255, 0, 1)" })
      ])
    ))

  it("changes nothing when the eye dropper closes, or once anchored", () => {
    const fresh = init({ id: "color", value: "#ff0000" })
    step(
      fresh,
      Message.PressedEyeDropper(),
      context,
      Command.resolve(OpenEyeDropper, Message.ClosedEyeDropper()),
      model((current) => expect(current).toEqual(fresh))
    )
    step(
      fresh,
      Message.Anchored(),
      context,
      model((current) => expect(current).toEqual(fresh))
    )
  })

  it.effect("runs the eye dropper where the browser has one", () =>
    Effect.gen(function* () {
      const missing = yield* OpenEyeDropper({ id: "color" }).effect
      expect(missing).toEqual(Message.ClosedEyeDropper())
      vi.stubGlobal(
        "EyeDropper",
        class {
          open = () => Promise.resolve({ sRGBHex: "#228be6" })
        }
      )
      expect(init({ id: "color" }).eyeDropperSupported).toBe(true)
      const picked = yield* OpenEyeDropper({ id: "color" }).effect
      expect(picked).toEqual(Message.PickedWithEyeDropper({ color: "#228be6" }))
      vi.stubGlobal(
        "EyeDropper",
        class {
          open = () => Promise.reject(new Error("cancelled"))
        }
      )
      const cancelled = yield* OpenEyeDropper({ id: "color" }).effect
      expect(cancelled).toEqual(Message.ClosedEyeDropper())
    })
  )
})
