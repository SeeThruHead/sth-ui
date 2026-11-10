import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

export type Serialize = (value: unknown, replacer: null, space: number) => string

export type Deserialize = (text: string) => unknown

export const validateJson = (value: string, deserialize: Deserialize): boolean => {
  if (value.trim().length === 0) return true

  try {
    deserialize(value)
    return true
  } catch {
    return false
  }
}

export const Model = Schema.Struct({ valid: Schema.Boolean })

export type Model = typeof Model.Type

const parse: Deserialize = (text) => JSON.parse(text)

const stringify: Serialize = (value, replacer, space) => JSON.stringify(value, replacer, space)

export const init = (config: { readonly value?: string; readonly deserialize?: Deserialize } = {}): Model => ({
  valid: validateJson(config.value ?? "", config.deserialize ?? parse)
})

export const Message = defineMessageUnion({
  Typed: { value: Schema.String },
  Focused: {},
  Blurred: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.String } })

export type OutMessage = typeof OutMessage.Type

export type JsonInputContext = {
  readonly value: string
  readonly formatOnBlur?: boolean
  readonly readOnly?: boolean
  readonly serialize?: Serialize
  readonly deserialize?: Deserialize
  readonly indentSpaces?: number
}

export type Result = { readonly model: Model; readonly outMessage?: OutMessage }

const formatted = (context: JsonInputContext, valid: boolean): Result["outMessage"] => {
  if (context.formatOnBlur !== true || context.readOnly === true) return undefined
  if (!valid || context.value.trim() === "") return undefined
  const deserialize = context.deserialize ?? parse
  const serialize = context.serialize ?? stringify

  return OutMessage.Changed({ value: serialize(deserialize(context.value), null, context.indentSpaces ?? 2) })
}

export const update = (model: Model, message: Message, context: JsonInputContext): Result =>
  Message.match(message, {
    Typed: ({ value }) => ({ model, outMessage: OutMessage.Changed({ value }) }),
    Focused: () => ({ model: { valid: true } }),
    Blurred: () => {
      const valid = validateJson(context.value, context.deserialize ?? parse)
      const outMessage = formatted(context, valid)

      return { model: { valid }, ...(outMessage === undefined ? {} : { outMessage }) }
    }
  })
