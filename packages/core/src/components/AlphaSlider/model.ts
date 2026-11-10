import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

export const Track = Schema.Struct({ left: Schema.Finite, width: Schema.Finite })

export type Track = typeof Track.Type

export const Model = Schema.Struct({
  id: Schema.String,
  dragging: Schema.Boolean,
  track: Track,
  position: Schema.Finite
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  dragging: false,
  track: { left: 0, width: 0 },
  position: 0
})

export const Message = defineMessageUnion({
  Pressed: { x: Schema.Finite, track: Track },
  Moved: { x: Schema.Finite },
  Released: {},
  PressedKey: { key: Schema.String }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Finite },
  ChangeEnded: { value: Schema.Finite },
  ScrubStarted: {},
  ScrubEnded: {}
})

export type OutMessage = typeof OutMessage.Type

export type ColorSliderContext = {
  readonly value: number
  readonly maxValue: number
  readonly round: boolean
  readonly decimals?: number
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const clamp = (fraction: number): number => Math.min(1, Math.max(0, fraction))

const roundTo = (value: number, decimals: number): number => Math.round(value * 10 ** decimals) / 10 ** decimals

export const valueAt = (fraction: number, context: ColorSliderContext): number => {
  const raw = fraction * context.maxValue
  if (context.round) return Math.round(raw)

  return context.decimals === undefined ? raw : roundTo(raw, context.decimals)
}

export const fractionAt = (x: number, track: Track): number =>
  track.width === 0 ? 0 : clamp((x - track.left) / track.width)

const steps: Readonly<Record<string, number>> = { ArrowRight: 0.05, ArrowLeft: -0.05 }

export const handledKeys: ReadonlySet<string> = new Set(Object.keys(steps))

const moveTo = (model: Model, x: number, context: ColorSliderContext): Result => {
  const position = fractionAt(x, model.track)

  return { model: { ...model, position }, outMessages: [OutMessage.Changed({ value: valueAt(position, context) })] }
}

const pressedKey = (model: Model, key: string, context: ColorSliderContext): Result => {
  const step = steps[key]
  if (step === undefined) return { model, outMessages: [] }
  const value = valueAt(clamp(context.value / context.maxValue + step), context)

  return { model, outMessages: [OutMessage.Changed({ value }), OutMessage.ChangeEnded({ value })] }
}

export const update = (model: Model, message: Message, context: ColorSliderContext): Result =>
  Message.match(message, {
    Pressed: ({ x, track }) => {
      const pressed = moveTo({ ...model, dragging: true, track }, x, context)

      return { ...pressed, outMessages: [OutMessage.ScrubStarted(), ...pressed.outMessages] }
    },
    Moved: ({ x }) => (model.dragging ? moveTo(model, x, context) : { model, outMessages: [] }),
    Released: () =>
      model.dragging
        ? {
            model: { ...model, dragging: false },
            outMessages: [OutMessage.ChangeEnded({ value: valueAt(model.position, context) }), OutMessage.ScrubEnded()]
          }
        : { model, outMessages: [] },
    PressedKey: ({ key }) => pressedKey(model, key, context)
  })
