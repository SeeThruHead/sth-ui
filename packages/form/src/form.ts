import { Duration, Effect, Equal, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { changeIndices, clearListState, reorderKeys } from "./lists.ts"
import { getPath, insertPath, removePath, reorderPath, replacePath, setPath } from "./paths.ts"
import { getStatus, shouldValidateOnChange, validateFieldValue, validateValues } from "./validate.ts"
import type { Errors, Validate } from "./validate.ts"
import type { FormError } from "./validators.ts"

export const FormErrorSchema = Schema.Union([Schema.String, Schema.Literal(true)])

const Status = Schema.Record(Schema.String, Schema.Boolean)

const ErrorRecord = Schema.Record(Schema.String, FormErrorSchema)

export const Model = Schema.Struct({
  name: Schema.String,
  values: Schema.Unknown,
  snapshot: Schema.Unknown,
  initialized: Schema.Boolean,
  errors: ErrorRecord,
  touched: Status,
  dirty: Status,
  submitting: Schema.Boolean,
  validating: Status,
  formValidating: Schema.Boolean,
  submitPending: Schema.Boolean,
  generation: Schema.Int,
  fieldGenerations: Schema.Record(Schema.String, Schema.Int)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedField: { path: Schema.String, value: Schema.Unknown },
  SetValues: { values: Schema.Unknown },
  Initialized: { values: Schema.Unknown },
  SetInitialValues: { values: Schema.Unknown },
  Reset: {},
  ResetField: { path: Schema.String },
  FocusedField: { path: Schema.String },
  BlurredField: { path: Schema.String },
  SetErrors: { errors: ErrorRecord },
  SetFieldError: { path: Schema.String, error: FormErrorSchema },
  ClearedErrors: {},
  ClearedFieldError: { path: Schema.String },
  SetTouched: { touched: Status },
  SetDirty: { dirty: Status },
  ResetTouched: {},
  ResetDirty: { values: Schema.Option(Schema.Unknown) },
  RequestedValidation: {},
  RequestedFieldValidation: { path: Schema.String },
  Submitted: {},
  SetSubmitting: { submitting: Schema.Boolean },
  InsertedListItem: { path: Schema.String, item: Schema.Unknown, index: Schema.Option(Schema.Int) },
  RemovedListItem: { path: Schema.String, index: Schema.Int },
  ReorderedListItem: { path: Schema.String, from: Schema.Int, to: Schema.Int },
  ReplacedListItem: { path: Schema.String, index: Schema.Int, item: Schema.Unknown },
  ValidatedForm: { generation: Schema.Int, errors: ErrorRecord },
  ValidatedField: { path: Schema.String, generation: Schema.Int, error: Schema.Option(FormErrorSchema) },
  ElapsedDebounce: { path: Schema.String, generation: Schema.Int }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ValuesChanged: { values: Schema.Unknown, previous: Schema.Unknown },
  SubmitSucceeded: { values: Schema.Unknown },
  SubmitFailed: { errors: ErrorRecord },
  WasReset: {}
})
export type OutMessage = typeof OutMessage.Type

export type FormContext = {
  readonly validate?: Validate
  readonly validateInputOnChange?: boolean | ReadonlyArray<string>
  readonly validateInputOnBlur?: boolean | ReadonlyArray<string>
  readonly clearInputErrorOnChange?: boolean
  readonly touchTrigger?: "change" | "focus"
  readonly validateDebounce?: number
  readonly transformValues?: (values: unknown) => unknown
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export type FormConfig = {
  readonly name?: string
  readonly initialValues?: unknown
  readonly initialErrors?: Errors
  readonly initialTouched?: Readonly<Record<string, boolean>>
  readonly initialDirty?: Readonly<Record<string, boolean>>
}

export const init = (config: FormConfig = {}): Model => ({
  name: config.name ?? "",
  values: config.initialValues ?? {},
  snapshot: config.initialValues ?? {},
  initialized: config.initialValues !== undefined,
  errors: config.initialErrors ?? {},
  touched: config.initialTouched ?? {},
  dirty: config.initialDirty ?? {},
  submitting: false,
  validating: {},
  formValidating: false,
  submitPending: false,
  generation: 0,
  fieldGenerations: {}
})

const none = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const without = <A>(record: Readonly<Record<string, A>>, key: string): Readonly<Record<string, A>> =>
  Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key))

const runForm = (effect: Effect.Effect<Errors>, generation: number, sync: Errors): Command.Command<Message> =>
  Command.define("FormValidation", {
    messages: [Message.ValidatedForm],
    execute: Effect.map(effect, (errors) => Message.ValidatedForm({ generation, errors: { ...sync, ...errors } }))
  })()

const runField = (
  effect: Effect.Effect<Option.Option<FormError>>,
  path: string,
  generation: number
): Command.Command<Message> =>
  Command.define("FormFieldValidation", {
    messages: [Message.ValidatedField],
    execute: Effect.map(effect, (error) => Message.ValidatedField({ path, generation, error }))
  })()

const Wait = Command.define("FormDebounce", {
  args: { path: Schema.String, generation: Schema.Int, millis: Schema.Finite },
  messages: [Message.ElapsedDebounce],
  execute: ({ path, generation, millis }) =>
    Effect.sleep(Duration.millis(millis)).pipe(Effect.as(Message.ElapsedDebounce({ path, generation })))
})

const calculatedDirty = (model: Model, path: string, value: unknown): Readonly<Record<string, boolean>> => ({
  ...clearListState(path, model.dirty),
  [path]: !Equal.equals(getPath(path, model.snapshot), value)
})

const withFieldError = (errors: Errors, path: string, error: Option.Option<FormError>): Errors =>
  Option.match(error, { onNone: () => without(errors, path), onSome: (found) => ({ ...errors, [path]: found }) })

const fieldGeneration = (model: Model, path: string) => (model.fieldGenerations[path] ?? 0) + 1

const runFieldValidation = (model: Model, path: string, context: FormContext): Result => {
  const validation = validateFieldValue(path, context.validate, model.values)
  const errors = withFieldError(model.errors, path, validation.error)

  return Option.match(validation.pending, {
    onNone: () => none({ ...model, errors }),
    onSome: (pending) => {
      const generation = fieldGeneration(model, path)

      return {
        model: {
          ...model,
          errors,
          validating: { ...model.validating, [path]: true },
          fieldGenerations: { ...model.fieldGenerations, [path]: generation }
        },
        commands: [runField(pending, path, generation)],
        outMessages: []
      }
    }
  })
}

const validateField = (model: Model, path: string, context: FormContext): Result => {
  const debounce = context.validateDebounce ?? 0
  if (debounce <= 0) return runFieldValidation(model, path, context)
  const generation = fieldGeneration(model, path)

  return {
    model: { ...model, fieldGenerations: { ...model.fieldGenerations, [path]: generation } },
    commands: [Wait({ path, generation, millis: debounce })],
    outMessages: []
  }
}

const changed = (model: Model, previous: unknown): ReadonlyArray<OutMessage> => [
  OutMessage.ValuesChanged({ values: model.values, previous })
]

const fieldChanged = (model: Model, path: string, value: unknown, context: FormContext): Result => {
  const validate = shouldValidateOnChange(path, context.validateInputOnChange ?? false)
  const clear = !validate && (context.clearInputErrorOnChange ?? true)
  const next: Model = {
    ...model,
    values: setPath(path, value, model.values),
    dirty: calculatedDirty(model, path, value),
    touched: (context.touchTrigger ?? "change") === "change" ? { ...model.touched, [path]: true } : model.touched,
    errors: clear ? without(model.errors, path) : model.errors
  }
  const validated = validate ? validateField(next, path, context) : none(next)

  return { ...validated, outMessages: changed(next, model.values) }
}

const merged = (previous: unknown, values: unknown): unknown => ({ ...Object(previous), ...Object(values) })

const valuesSet = (model: Model, values: unknown, context: FormContext): Result => {
  const next: Model = {
    ...model,
    values: merged(model.values, values),
    dirty: Object.entries(Object(values)).reduce(
      (dirty, [key, value]) => calculatedDirty({ ...model, dirty }, key, value),
      model.dirty
    ),
    errors: (context.clearInputErrorOnChange ?? true) ? {} : model.errors
  }

  return { model: next, commands: [], outMessages: changed(next, model.values) }
}

const finishSubmit = (model: Model, errors: Errors, context: FormContext): Result => {
  const done = { ...model, errors, submitPending: false, formValidating: false }
  if (Object.keys(errors).length > 0)
    return { model: done, commands: [], outMessages: [OutMessage.SubmitFailed({ errors })] }
  const transform = context.transformValues ?? ((values: unknown) => values)

  return { model: done, commands: [], outMessages: [OutMessage.SubmitSucceeded({ values: transform(model.values) })] }
}

const validateAll = (model: Model, context: FormContext, submit: boolean): Result => {
  const validation = validateValues(context.validate, model.values)

  return Option.match(validation.pending, {
    onNone: () =>
      submit ? finishSubmit(model, validation.errors, context) : none({ ...model, errors: validation.errors }),
    onSome: (pending) => {
      const generation = model.generation + 1

      return {
        model: { ...model, errors: validation.errors, formValidating: true, submitPending: submit, generation },
        commands: [runForm(pending, generation, validation.errors)],
        outMessages: []
      }
    }
  })
}

const listed = (
  model: Model,
  values: unknown,
  state: <A>(record: Readonly<Record<string, A>>) => Readonly<Record<string, A>>
): Result => {
  const next: Model = {
    ...model,
    values,
    errors: state(model.errors),
    touched: state(model.touched),
    dirty: state(model.dirty)
  }

  return { model: next, commands: [], outMessages: changed(next, model.values) }
}

const resetForm = (model: Model): Result => ({
  model: {
    ...model,
    values: model.snapshot,
    errors: {},
    dirty: {},
    touched: {},
    validating: {},
    formValidating: false,
    submitPending: false,
    generation: model.generation + 1,
    fieldGenerations: {}
  },
  commands: [],
  outMessages: [OutMessage.WasReset(), ...changed({ ...model, values: model.snapshot }, model.values)]
})

const fieldValidated = (model: Model, message: Extract<Message, { readonly _tag: "ValidatedField" }>): Result => {
  if (model.fieldGenerations[message.path] !== message.generation) return none(model)

  return none({
    ...model,
    errors: withFieldError(model.errors, message.path, message.error),
    validating: without(model.validating, message.path)
  })
}

export const update = (model: Model, message: Message, context: FormContext = {}): Result =>
  Message.match(message, {
    ChangedField: ({ path, value }) => fieldChanged(model, path, value, context),
    SetValues: ({ values }) => valuesSet(model, values, context),
    Initialized: ({ values }) =>
      model.initialized
        ? none(model)
        : valuesSet({ ...model, snapshot: values, initialized: true, values }, values, context),
    SetInitialValues: ({ values }) => none({ ...model, snapshot: values }),
    Reset: () => resetForm(model),
    ResetField: ({ path }) => {
      const value = getPath(path, model.snapshot)
      const next = {
        ...model,
        values: setPath(path, value, model.values),
        dirty: without(model.dirty, path),
        errors: without(model.errors, path)
      }

      return { model: next, commands: [], outMessages: changed(next, model.values) }
    },
    FocusedField: ({ path }) => none({ ...model, touched: { ...model.touched, [path]: true } }),
    BlurredField: ({ path }) =>
      shouldValidateOnChange(path, context.validateInputOnBlur ?? false)
        ? validateField(model, path, context)
        : none(model),
    SetErrors: ({ errors }) => none({ ...model, errors }),
    SetFieldError: ({ path, error }) => none({ ...model, errors: { ...model.errors, [path]: error } }),
    ClearedErrors: () => none({ ...model, errors: {} }),
    ClearedFieldError: ({ path }) => none({ ...model, errors: without(model.errors, path) }),
    SetTouched: ({ touched }) => none({ ...model, touched }),
    SetDirty: ({ dirty }) => none({ ...model, dirty }),
    ResetTouched: () => none({ ...model, touched: {} }),
    ResetDirty: ({ values }) =>
      none({
        ...model,
        dirty: {},
        snapshot: Option.match(values, {
          onNone: () => model.values,
          onSome: (partial) => merged(model.values, partial)
        })
      }),
    RequestedValidation: () => validateAll(model, context, false),
    RequestedFieldValidation: ({ path }) => runFieldValidation(model, path, context),
    Submitted: () => validateAll(model, context, true),
    SetSubmitting: ({ submitting }) => none({ ...model, submitting }),
    InsertedListItem: ({ path, item, index }) =>
      listed(model, insertPath(path, item, Option.getOrUndefined(index), model.values), (record) =>
        changeIndices(path, Option.getOrUndefined(index), record, 1)
      ),
    RemovedListItem: ({ path, index }) =>
      listed(model, removePath(path, index, model.values), (record) => changeIndices(path, index, record, -1)),
    ReorderedListItem: ({ path, from, to }) =>
      listed(model, reorderPath(path, { from, to }, model.values), (record) => reorderKeys(path, { from, to }, record)),
    ReplacedListItem: ({ path, index, item }) =>
      listed(model, replacePath(path, item, index, model.values), (record) => record),
    ValidatedForm: ({ generation, errors }) => {
      if (generation !== model.generation) return none(model)

      return model.submitPending
        ? finishSubmit(model, errors, context)
        : none({ ...model, errors, formValidating: false })
    },
    ValidatedField: (validated) => fieldValidated(model, validated),
    ElapsedDebounce: ({ path, generation }) =>
      model.fieldGenerations[path] === generation ? runFieldValidation(model, path, context) : none(model)
  })

export const getValues = (model: Model): unknown => model.values

export const getValue = (model: Model, path: string): unknown => getPath(path, model.values)

export const isDirty = (model: Model, path?: string): boolean => {
  if (path === undefined) {
    return Object.keys(model.dirty).length > 0 ? getStatus(model.dirty) : !Equal.equals(model.values, model.snapshot)
  }
  const overridden = model.dirty[path]
  if (overridden !== undefined) return overridden

  return !Equal.equals(getPath(path, model.values), getPath(path, model.snapshot))
}

export const isTouched = (model: Model, path?: string): boolean => getStatus(model.touched, path)

export const isValidating = (model: Model, path?: string): boolean =>
  path === undefined ? model.formValidating || getStatus(model.validating) : model.validating[path] === true

export const isValid = (model: Model, context: FormContext = {}, path?: string): boolean =>
  path === undefined
    ? Object.keys(validateValues(context.validate, model.values).errors).length === 0
    : Option.isNone(validateFieldValue(path, context.validate, model.values).error)

export const errorOf = (model: Model, path: string): Option.Option<FormError> =>
  Option.fromNullishOr(model.errors[path])

export const setFieldValue = (path: string, value: unknown): Message => Message.ChangedField({ path, value })

export const setValues = (values: unknown): Message => Message.SetValues({ values })

export const insertListItem = (path: string, item: unknown, index?: number): Message =>
  Message.InsertedListItem({ path, item, index: Option.fromNullishOr(index) })

export const removeListItem = (path: string, index: number): Message => Message.RemovedListItem({ path, index })

export const reorderListItem = (path: string, payload: { readonly from: number; readonly to: number }): Message =>
  Message.ReorderedListItem({ path, ...payload })

export const replaceListItem = (path: string, index: number, item: unknown): Message =>
  Message.ReplacedListItem({ path, index, item })

export const submit = (): Message => Message.Submitted()

export const reset = (): Message => Message.Reset()

export const validate = (): Message => Message.RequestedValidation()

export const validateFieldMessage = (path: string): Message => Message.RequestedFieldValidation({ path })
