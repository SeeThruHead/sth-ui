import { Option } from "effect"
import { getValue, Message, setFieldValue } from "./form.ts"
import type { Model } from "./form.ts"
import type { FormError } from "./validators.ts"

export type InputOptions = { readonly withError?: boolean; readonly withFocus?: boolean }

type Shared<M> = { readonly error?: FormError; readonly onFocus?: M; readonly onBlur?: M }

const shared = <M>(form: Model, path: string, send: (message: Message) => M, options: InputOptions): Shared<M> => ({
  ...((options.withError ?? true)
    ? Option.match(Option.fromNullishOr(form.errors[path]), { onNone: () => ({}), onSome: (error) => ({ error }) })
    : {}),
  ...((options.withFocus ?? true)
    ? { onFocus: send(Message.FocusedField({ path })), onBlur: send(Message.BlurredField({ path })) }
    : {})
})

export const textInputProps = <M>(
  form: Model,
  path: string,
  send: (message: Message) => M,
  options: InputOptions = {}
): Shared<M> & { readonly value: string; readonly onInput: (value: string) => M } => {
  const value = getValue(form, path)

  return {
    value: typeof value === "string" ? value : "",
    onInput: (next) => send(setFieldValue(path, next)),
    ...shared(form, path, send, options)
  }
}

export const numberInputProps = <M>(
  form: Model,
  path: string,
  send: (message: Message) => M,
  options: InputOptions = {}
): Shared<M> & { readonly value: number | string; readonly onChange: (value: number | string) => M } => {
  const value = getValue(form, path)

  return {
    value: typeof value === "number" || typeof value === "string" ? value : "",
    onChange: (next) => send(setFieldValue(path, next)),
    ...shared(form, path, send, options)
  }
}

export const checkboxProps = <M>(
  form: Model,
  path: string,
  send: (message: Message) => M,
  options: InputOptions = {}
): Shared<M> & { readonly checked: boolean; readonly onChange: (checked: boolean) => M } => ({
  checked: getValue(form, path) === true,
  onChange: (checked) => send(setFieldValue(path, checked)),
  ...shared(form, path, send, options)
})

export const radioProps = <M>(
  form: Model,
  path: string,
  value: string,
  send: (message: Message) => M,
  options: InputOptions = {}
): Shared<M> & { readonly checked: boolean; readonly value: string; readonly onChange: (checked: boolean) => M } => ({
  checked: getValue(form, path) === value,
  value,
  onChange: () => send(setFieldValue(path, value)),
  ...shared(form, path, send, { withFocus: false, ...options })
})

export const valueProps = <A, M>(
  form: Model,
  path: string,
  read: (value: unknown) => A,
  send: (message: Message) => M,
  options: InputOptions = {}
): Shared<M> & { readonly value: A; readonly onChange: (value: A) => M } => ({
  value: read(getValue(form, path)),
  onChange: (next) => send(setFieldValue(path, next)),
  ...shared(form, path, send, options)
})
