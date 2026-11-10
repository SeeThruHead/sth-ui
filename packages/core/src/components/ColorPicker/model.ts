import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import * as ColorSlider from "../AlphaSlider/model.ts"
import { convertHsvaTo, isColorValid, parseColor } from "./color.ts"
import type { ColorFormat, HsvaColor } from "./color.ts"

const Hsva = Schema.Struct({ h: Schema.Finite, s: Schema.Finite, v: Schema.Finite, a: Schema.Finite })

export const Box = Schema.Struct({
  left: Schema.Finite,
  top: Schema.Finite,
  width: Schema.Finite,
  height: Schema.Finite
})

export type Box = typeof Box.Type

export const Model = Schema.Struct({
  id: Schema.String,
  color: Hsva,
  dragging: Schema.Boolean,
  box: Box,
  hue: ColorSlider.Model,
  alpha: ColorSlider.Model
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string; readonly value?: string }): Model => ({
  id: config.id,
  color: parseColor(config.value ?? "#FFFFFF"),
  dragging: false,
  box: { left: 0, top: 0, width: 0, height: 0 },
  hue: ColorSlider.init({ id: `${config.id}-hue` }),
  alpha: ColorSlider.init({ id: `${config.id}-alpha` })
})

export const Message = defineMessageUnion({
  GotHue: { message: ColorSlider.Message },
  GotAlpha: { message: ColorSlider.Message },
  PressedSaturation: { x: Schema.Finite, y: Schema.Finite, box: Box },
  MovedSaturation: { x: Schema.Finite, y: Schema.Finite },
  ReleasedSaturation: {},
  PressedSaturationKey: { key: Schema.String },
  PickedSwatch: { color: Schema.String }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.String },
  ChangeEnded: { value: Schema.String },
  SwatchClicked: { value: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type ColorPickerContext = { readonly format?: ColorFormat }

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const formatOf = (context: ColorPickerContext): ColorFormat => context.format ?? "hex"

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

const changed = (model: Model, color: HsvaColor, context: ColorPickerContext): Result => ({
  model: { ...model, color },
  outMessages: [OutMessage.Changed({ value: convertHsvaTo(formatOf(context), color) })]
})

const ended = (color: HsvaColor, context: ColorPickerContext) =>
  OutMessage.ChangeEnded({ value: convertHsvaTo(formatOf(context), color) })

const saturationAt = (model: Model, x: number, y: number, box: Box): HsvaColor => ({
  ...model.color,
  s: Math.round(clamp(box.width === 0 ? 0 : (x - box.left) / box.width) * 100),
  v: Math.round((1 - clamp(box.height === 0 ? 0 : (y - box.top) / box.height)) * 100)
})

const steps: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -0.05],
  ArrowDown: [0, 0.05],
  ArrowRight: [0.05, 0],
  ArrowLeft: [-0.05, 0]
}

export const saturationKeys: ReadonlySet<string> = new Set(Object.keys(steps))

const pressedKey = (model: Model, key: string, context: ColorPickerContext): Result => {
  const step = steps[key]
  if (step === undefined) return { model, outMessages: [] }
  const x = clamp(model.color.s / 100 + step[0])
  const y = clamp(1 - model.color.v / 100 + step[1])
  const color = { ...model.color, s: Math.round(x * 100), v: Math.round((1 - y) * 100) }
  const result = changed(model, color, context)

  return { ...result, outMessages: [...result.outMessages, ended(color, context)] }
}

type Channel = "h" | "a"

const sliderContext = (channel: Channel, color: HsvaColor): ColorSlider.ColorSliderContext =>
  channel === "h"
    ? { value: color.h, maxValue: 360, round: true }
    : { value: color.a, maxValue: 1, round: false, decimals: 2 }

const fromSlider = (
  model: Model,
  channel: Channel,
  message: ColorSlider.Message,
  context: ColorPickerContext
): Result => {
  const slider = channel === "h" ? model.hue : model.alpha
  const result = ColorSlider.update(slider, message, sliderContext(channel, model.color))
  const moved = { ...model, ...(channel === "h" ? { hue: result.model } : { alpha: result.model }) }

  return result.outMessages.reduce<Result>(
    (state, out) =>
      ColorSlider.OutMessage.match(out, {
        Changed: ({ value }) => {
          const next = changed(state.model, { ...state.model.color, [channel]: value }, context)

          return { model: next.model, outMessages: [...state.outMessages, ...next.outMessages] }
        },
        ChangeEnded: ({ value }) => ({
          ...state,
          outMessages: [...state.outMessages, ended({ ...state.model.color, [channel]: value }, context)]
        }),
        ScrubStarted: () => state,
        ScrubEnded: () => state
      }),
    { model: moved, outMessages: [] }
  )
}

export const setValue = (model: Model, value: string): Model =>
  !model.dragging && isColorValid(value) ? { ...model, color: parseColor(value) } : model

export const update = (model: Model, message: Message, context: ColorPickerContext): Result =>
  Message.match(message, {
    GotHue: ({ message: inner }) => fromSlider(model, "h", inner, context),
    GotAlpha: ({ message: inner }) => fromSlider(model, "a", inner, context),
    PressedSaturation: ({ x, y, box }) =>
      changed({ ...model, dragging: true, box }, saturationAt(model, x, y, box), context),
    MovedSaturation: ({ x, y }) =>
      model.dragging ? changed(model, saturationAt(model, x, y, model.box), context) : { model, outMessages: [] },
    ReleasedSaturation: () =>
      model.dragging
        ? { model: { ...model, dragging: false }, outMessages: [ended(model.color, context)] }
        : { model, outMessages: [] },
    PressedSaturationKey: ({ key }) => pressedKey(model, key, context),
    PickedSwatch: ({ color }) => {
      const value = convertHsvaTo(formatOf(context), parseColor(color))

      return {
        model: { ...model, color: parseColor(color) },
        outMessages: [
          OutMessage.Changed({ value: color }),
          OutMessage.SwatchClicked({ value }),
          OutMessage.ChangeEnded({ value })
        ]
      }
    }
  })
