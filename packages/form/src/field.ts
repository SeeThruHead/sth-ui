import { Effect, Equal, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { FormErrorSchema } from "./form.ts"
import type { FormError, RuleResult } from "./validators.ts"

export const Model = Schema.Struct({
  value: Schema.Unknown,
  initialValue: Schema.Unknown,
  error: Schema.Option(FormErrorSchema),
  touched: Schema.Boolean,
  validating: Schema.Boolean,
  generation: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { value: Schema.Unknown },
  Focused: {},
  Blurred: {},
  RequestedValidation: {},
  Validated: { generation: Schema.Int, error: Schema.Option(FormErrorSchema) },
  SetError: { error: Schema.Option(FormErrorSchema) },
  Reset: {},
  ResetTouched: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ ValueChanged: { value: Schema.Unknown } })
export type OutMessage = typeof OutMessage.Type

export type FieldContext = {
  readonly validate?: (value: unknown) => RuleResult | Effect.Effect<RuleResult>
  readonly validateOnChange?: boolean
  readonly validateOnBlur?: boolean
  readonly clearErrorOnChange?: boolean
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: {
  readonly initialValue: unknown
  readonly initialError?: FormError
  readonly initialTouched?: boolean
}): Model => ({
  value: config.initialValue,
  initialValue: config.initialValue,
  error: Option.fromNullishOr(config.initialError),
  touched: config.initialTouched === true,
  validating: false,
  generation: 0
})

const none = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const errorOf = (result: RuleResult): Option.Option<FormError> =>
  result === null || result === undefined || result === false ? Option.none() : Option.some(result)

const validated = (model: Model, context: FieldContext): Result => {
  const result = context.validate === undefined ? null : context.validate(model.value)
  if (!Effect.isEffect(result)) return none({ ...model, error: errorOf(result) })
  const generation = model.generation + 1

  return {
    model: { ...model, validating: true, generation },
    commands: [
      Command.define("FieldValidation", {
        messages: [Message.Validated],
        execute: Effect.map(result, (outcome) => Message.Validated({ generation, error: errorOf(outcome) }))
      })()
    ],
    outMessages: []
  }
}

const changed = (model: Model, value: unknown, context: FieldContext): Result => {
  if (Equal.equals(model.value, value)) return none(model)
  const next = { ...model, value, error: (context.clearErrorOnChange ?? true) ? Option.none() : model.error }
  const result = context.validateOnChange === true ? validated(next, context) : none(next)

  return { ...result, outMessages: [OutMessage.ValueChanged({ value })] }
}

export const update = (model: Model, message: Message, context: FieldContext = {}): Result =>
  Message.match(message, {
    Changed: ({ value }) => changed(model, value, context),
    Focused: () => none({ ...model, touched: true }),
    Blurred: () => (context.validateOnBlur === true ? validated(model, context) : none(model)),
    RequestedValidation: () => validated(model, context),
    Validated: ({ generation, error }) =>
      generation === model.generation ? none({ ...model, error, validating: false }) : none(model),
    SetError: ({ error }) => none({ ...model, error }),
    Reset: () => {
      const result = changed({ ...model, error: Option.none(), touched: false }, model.initialValue, {
        ...context,
        validateOnChange: false
      })

      return { ...result, model: { ...result.model, error: Option.none(), touched: false } }
    },
    ResetTouched: () => none({ ...model, touched: false })
  })

export const isDirty = (model: Model): boolean => !Equal.equals(model.value, model.initialValue)

export const setValue = (value: unknown): Message => Message.Changed({ value })

export type FieldInputProps<M> = {
  readonly value: unknown
  readonly onChange: (value: unknown) => M
  readonly error?: FormError
  readonly onFocus?: M
  readonly onBlur?: M
}

export const fieldProps = <M>(
  model: Model,
  send: (message: Message) => M,
  options: { readonly withError?: boolean; readonly withFocus?: boolean } = {}
): FieldInputProps<M> => ({
  value: model.value,
  onChange: (value) => send(Message.Changed({ value })),
  ...((options.withError ?? true)
    ? Option.match(model.error, { onNone: () => ({}), onSome: (error) => ({ error }) })
    : {}),
  ...((options.withFocus ?? true) ? { onFocus: send(Message.Focused()), onBlur: send(Message.Blurred()) } : {})
})

export const textFieldProps = <M>(
  model: Model,
  send: (message: Message) => M,
  options: { readonly withError?: boolean; readonly withFocus?: boolean } = {}
) => {
  const { value, onChange, ...rest } = fieldProps(model, send, options)

  return { ...rest, value: typeof value === "string" ? value : "", onInput: (next: string) => onChange(next) }
}
