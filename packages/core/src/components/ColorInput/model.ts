import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { convertHsvaTo, isColorValid, parseColor } from "../ColorPicker/color.ts"
import type { ColorFormat } from "../ColorPicker/color.ts"
import * as ColorPicker from "../ColorPicker/model.ts"

type EyeDropperResult = { readonly sRGBHex: string }

type EyeDropperApi = new () => { readonly open: () => Promise<EyeDropperResult> }

const isEyeDropperApi = (value: unknown): value is EyeDropperApi => typeof value === "function"

const eyeDropperApi = (): Option.Option<EyeDropperApi> => {
  const found: unknown = Reflect.get(globalThis, "EyeDropper")

  return Option.liftPredicate(found, isEyeDropperApi)
}

export const Model = Schema.Struct({
  id: Schema.String,
  opened: Schema.Boolean,
  lastValidValue: Schema.String,
  eyeDropperSupported: Schema.Boolean,
  picker: ColorPicker.Model
})

export type Model = typeof Model.Type

export const isRemembered = (value: string): boolean => isColorValid(value) || value.trim() === ""

export const init = (config: {
  readonly id: string
  readonly value?: string
  readonly eyeDropperSupported?: boolean
}): Model => {
  const value = config.value ?? ""

  return {
    id: config.id,
    opened: false,
    lastValidValue: isRemembered(value) ? value : "",
    eyeDropperSupported: config.eyeDropperSupported ?? "EyeDropper" in globalThis,
    picker: ColorPicker.init({ id: `${config.id}-picker`, value })
  }
}

export const Message = defineMessageUnion({
  Typed: { value: Schema.String },
  Focused: {},
  Blurred: {},
  Clicked: {},
  GotPicker: { message: ColorPicker.Message },
  PressedEyeDropper: {},
  PickedWithEyeDropper: { color: Schema.String },
  ClosedEyeDropper: {},
  Anchored: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.String },
  ChangeEnded: { value: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type ColorInputContext = {
  readonly value: string
  readonly format?: ColorFormat
  readonly fixOnBlur?: boolean
  readonly closeOnColorSwatchClick?: boolean
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

class EyeDropperUnavailable extends Schema.TaggedError<EyeDropperUnavailable, { readonly brand: unique symbol }>()(
  "EyeDropperUnavailable",
  {}
) {}

export const OpenEyeDropper = Command.define("ColorInputOpenEyeDropper", {
  args: { id: Schema.String },
  messages: [Message.PickedWithEyeDropper, Message.ClosedEyeDropper],
  execute: () =>
    Effect.fromOption(eyeDropperApi()).pipe(
      Effect.flatMap((Api) =>
        Effect.tryPromise({ try: () => new Api().open(), catch: () => new EyeDropperUnavailable({}) })
      ),
      Effect.map((result) => Message.PickedWithEyeDropper({ color: result.sRGBHex })),
      Effect.orElseSucceed(() => Message.ClosedEyeDropper())
    )
})

const formatOf = (context: ColorInputContext): ColorFormat => context.format ?? "hex"

const remembered = (model: Model, value: string): Model =>
  isRemembered(value) ? { ...model, lastValidValue: value } : model

const unchanged = (model: Model): Result => ({ model, commands: [], outMessages: [] })

export const setValue = (model: Model, value: string): Model =>
  remembered({ ...model, picker: ColorPicker.setValue(model.picker, value) }, value)

const typed = (model: Model, value: string, context: ColorInputContext): Result => ({
  model: setValue(model, value),
  commands: [],
  outMessages: [
    OutMessage.Changed({ value }),
    ...(isColorValid(value)
      ? [OutMessage.ChangeEnded({ value: convertHsvaTo(formatOf(context), parseColor(value)) })]
      : [])
  ]
})

const blurred = (model: Model, context: ColorInputContext): Result => {
  const closed = { ...model, opened: false }
  if (context.fixOnBlur === false) return unchanged(closed)
  if (context.value === model.lastValidValue) return unchanged(closed)

  return {
    model: setValue(closed, model.lastValidValue),
    commands: [],
    outMessages: [OutMessage.Changed({ value: model.lastValidValue })]
  }
}

const fromPicker = (model: Model, message: ColorPicker.Message, context: ColorInputContext): Result => {
  const result = ColorPicker.update(model.picker, message, { format: formatOf(context) })

  return result.outMessages.reduce<Result>(
    (state, out) =>
      ColorPicker.OutMessage.match(out, {
        Changed: ({ value }) => ({
          ...state,
          model: remembered(state.model, value),
          outMessages: [...state.outMessages, OutMessage.Changed({ value })]
        }),
        ChangeEnded: ({ value }) => ({
          ...state,
          outMessages: [...state.outMessages, OutMessage.ChangeEnded({ value })]
        }),
        SwatchClicked: () =>
          context.closeOnColorSwatchClick === true ? { ...state, model: { ...state.model, opened: false } } : state
      }),
    { model: { ...model, picker: result.model }, commands: [], outMessages: [] }
  )
}

const pickedWithEyeDropper = (model: Model, color: string, context: ColorInputContext): Result => {
  const value = convertHsvaTo(formatOf(context), parseColor(color))

  return {
    model: setValue(model, value),
    commands: [],
    outMessages: [OutMessage.Changed({ value }), OutMessage.ChangeEnded({ value })]
  }
}

export const update = (model: Model, message: Message, context: ColorInputContext): Result =>
  Message.match(message, {
    Typed: ({ value }) => typed(model, value, context),
    Focused: () => unchanged({ ...model, opened: true }),
    Clicked: () => unchanged({ ...model, opened: true }),
    Blurred: () => blurred(model, context),
    GotPicker: ({ message: inner }) => fromPicker(model, inner, context),
    PressedEyeDropper: () => ({ model, commands: [OpenEyeDropper({ id: model.id })], outMessages: [] }),
    PickedWithEyeDropper: ({ color }) => pickedWithEyeDropper(model, color, context),
    ClosedEyeDropper: () => unchanged(model),
    Anchored: () => unchanged(model)
  })
