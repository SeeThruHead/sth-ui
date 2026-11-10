import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { clampTimeString, defaultAmPmLabels, emptyFields, parseTime, timeString } from "../time/clock.ts"
import type { AmPmLabels, Fields, TimeFormat } from "../time/clock.ts"
import { spinKey, typedSpin } from "../time/spin.ts"
import { FocusField } from "./focus.ts"
import type { SpinBounds } from "../time/spin.ts"

export const NumberField = Schema.Literals(["hours", "minutes", "seconds"])
export type NumberField = typeof NumberField.Type

export const Field = Schema.Literals(["hours", "minutes", "seconds", "amPm"])
export type Field = typeof Field.Type

const FieldsSchema = Schema.Struct({
  hours: Schema.NullOr(Schema.Finite),
  minutes: Schema.NullOr(Schema.Finite),
  seconds: Schema.NullOr(Schema.Finite),
  amPm: Schema.NullOr(Schema.String)
})

export const Model = Schema.Struct({
  id: Schema.String,
  fields: FieldsSchema,
  wasInvalid: Schema.Boolean,
  opened: Schema.Boolean,
  focused: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Typed: { field: NumberField, text: Schema.String },
  PressedKey: { field: NumberField, key: Schema.String, wholeSelected: Schema.Boolean },
  PressedAmPmKey: { key: Schema.String, code: Schema.String },
  ChoseNumber: { field: NumberField, value: Schema.Finite },
  ChoseAmPm: { value: Schema.NullOr(Schema.String) },
  LeftHours: { text: Schema.String },
  Pasted: { text: Schema.String },
  FocusedField: {},
  LeftFields: {},
  ClickedRoot: {},
  Cleared: {},
  ChosePreset: { value: Schema.String },
  CompletedFocus: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.String },
  Focused: {},
  Blurred: {}
})
export type OutMessage = typeof OutMessage.Type

export type TimePickerType = "time" | "duration"

export type TimePickerContext = {
  readonly type?: TimePickerType
  readonly format?: TimeFormat
  readonly withSeconds?: boolean
  readonly amPmLabels?: AmPmLabels
  readonly min?: string
  readonly max?: string
  readonly hoursStep?: number
  readonly minutesStep?: number
  readonly secondsStep?: number
  readonly readOnly?: boolean
  readonly disabled?: boolean
  readonly closeDropdownOnPresetSelect?: boolean
  readonly pasteSplit?: (text: string) => Fields
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const fieldId = (id: string, field: Field) => `${id}-${field}`

export const formatOf = (context: TimePickerContext): TimeFormat =>
  context.type === "duration" ? "24h" : (context.format ?? "24h")

const labelsOf = (context: TimePickerContext) => context.amPmLabels ?? defaultAmPmLabels

const options = (context: TimePickerContext) => ({
  format: formatOf(context),
  withSeconds: context.withSeconds === true,
  amPmLabels: labelsOf(context)
})

export const boundsOf = (field: NumberField, context: TimePickerContext): SpinBounds => {
  if (field === "minutes") return { min: 0, max: 59, step: context.minutesStep ?? 1 }
  if (field === "seconds") return { min: 0, max: 59, step: context.secondsStep ?? 1 }
  if (context.type === "duration") return { min: 0, max: Number.POSITIVE_INFINITY, step: context.hoursStep ?? 1 }
  const twelve = formatOf(context) === "12h"

  return { min: twelve ? 1 : 0, max: twelve ? 12 : 23, step: context.hoursStep ?? 1 }
}

export const init = (
  config: { readonly id: string; readonly value?: string },
  context: TimePickerContext = {}
): Model => {
  const fields = parseTime(config.value ?? "", formatOf(context), labelsOf(context))

  return {
    id: config.id,
    fields,
    wasInvalid: Option.isNone(timeString(fields, options(context))),
    opened: false,
    focused: false
  }
}

const focus = (model: Model, field: Field): Command.Command<Message> =>
  FocusField({ selector: `#${fieldId(model.id, field)}` })

const nextOf = (field: NumberField, context: TimePickerContext): Option.Option<Field> => {
  if (field === "hours") return Option.some("minutes")
  if (field === "minutes" && context.withSeconds === true) return Option.some("seconds")

  return formatOf(context) === "12h" ? Option.some("amPm") : Option.none()
}

const previousOf = (field: Field, context: TimePickerContext): Option.Option<Field> => {
  if (field === "hours") return Option.none()
  if (field === "minutes") return Option.some("hours")
  if (field === "seconds") return Option.some("minutes")

  return Option.some(context.withSeconds === true ? "seconds" : "minutes")
}

const moved = (model: Model, target: Option.Option<Field>): Result => ({
  model,
  commands: Option.match(target, { onNone: () => [], onSome: (field) => [focus(model, field)] }),
  outMessages: []
})

const changedField = (model: Model, fields: Fields, field: Field, context: TimePickerContext): Result => {
  const value = timeString(fields, options(context))
  const commands = [focus(model, field)]

  return Option.match(value, {
    onSome: (time) => ({
      model: { ...model, fields, wasInvalid: false },
      commands,
      outMessages: [OutMessage.Changed({ value: time })]
    }),
    onNone: () => ({
      model: { ...model, fields, wasInvalid: true },
      commands,
      outMessages: model.wasInvalid ? [] : [OutMessage.Changed({ value: "" })]
    })
  })
}

const setNumber = (model: Model, field: NumberField, value: number | null, context: TimePickerContext): Result => {
  const adjusted =
    field === "hours" && formatOf(context) === "12h" && value !== null && value > 12 ? ((value - 1) % 12) + 1 : value

  return changedField(model, { ...model.fields, [field]: adjusted }, field, context)
}

const typed = (model: Model, field: NumberField, text: string, context: TimePickerContext): Result =>
  Option.match(
    typedSpin(text, {
      ...boundsOf(field, context),
      allowTemporaryZero: field === "hours" && formatOf(context) === "12h",
      disableAutoAdvance: field === "hours" && context.type === "duration"
    }),
    {
      onNone: () => ({ model, commands: [], outMessages: [] }),
      onSome: ({ value, advance }) => {
        const result = setNumber(model, field, value, context)
        const next = advance ? nextOf(field, context) : Option.none()

        return Option.match(next, {
          onNone: () => result,
          onSome: (target) => ({ ...result, commands: [focus(model, target)] })
        })
      }
    }
  )

const keyed = (
  model: Model,
  field: NumberField,
  key: string,
  wholeSelected: boolean,
  context: TimePickerContext
): Result =>
  Option.match(spinKey(key, model.fields[field], boundsOf(field, context), wholeSelected), {
    onNone: () => ({ model, commands: [], outMessages: [] }),
    onSome: (action) => {
      if (action._tag === "Next") return moved(model, nextOf(field, context))
      if (action._tag === "Previous") return moved(model, previousOf(field, context))

      return setNumber(model, field, action.value, context)
    }
  })

const amPmKey = (model: Model, key: string, code: string, context: TimePickerContext): Result => {
  const labels = labelsOf(context)
  const set = (value: string | null) => changedField(model, { ...model.fields, amPm: value }, "amPm", context)
  if (key === "Home" || code === "KeyA") return set(labels.am)
  if (key === "End" || code === "KeyP") return set(labels.pm)
  if (key === "Backspace" || key === "Delete")
    return model.fields.amPm === null ? moved(model, previousOf("amPm", context)) : set(null)
  if (key === "ArrowLeft") return moved(model, previousOf("amPm", context))
  if (key === "ArrowUp" || key === "ArrowDown") return set(model.fields.amPm === labels.am ? labels.pm : labels.am)

  return { model, commands: [], outMessages: [] }
}

export const setValue = (model: Model, value: string, context: TimePickerContext = {}): Model => {
  const fields = parseTime(value, formatOf(context), labelsOf(context))

  return { ...model, fields, wasInvalid: Option.isNone(timeString(fields, options(context))) }
}

const setTime = (model: Model, value: string, context: TimePickerContext): Result => ({
  model: setValue(model, value, context),
  commands: [],
  outMessages: [OutMessage.Changed({ value })]
})

const pasted = (model: Model, text: string, context: TimePickerContext): Result => {
  const fields = (
    context.pasteSplit ?? ((pastedText: string) => parseTime(pastedText, formatOf(context), labelsOf(context)))
  )(text)

  return Option.match(timeString(fields, options(context)), {
    onNone: () => ({ model, commands: [], outMessages: [] }),
    onSome: (time) => {
      const highest = context.type === "duration" ? context.max : (context.max ?? "23:59:59")

      return setTime(
        model,
        clampTimeString(time, context.min ?? "00:00:00", highest, context.withSeconds === true),
        context
      )
    }
  })
}

const left = (model: Model, context: TimePickerContext): Result => {
  const closed = { ...model, opened: false, focused: false }
  const blurred = [OutMessage.Blurred()]
  const limited = context.min !== undefined || context.max !== undefined
  const time = Option.filter(timeString(model.fields, options(context)), () => limited)

  return Option.match(time, {
    onNone: () => ({ model: closed, commands: [], outMessages: blurred }),
    onSome: (value) => {
      const clamped = clampTimeString(value, context.min, context.max, context.withSeconds === true)
      if (clamped === value) return { model: closed, commands: [], outMessages: blurred }
      const result = setTime(closed, clamped, context)

      return { ...result, outMessages: [...result.outMessages, ...blurred] }
    }
  })
}

const focused = (model: Model, context: TimePickerContext): Result => ({
  model: { ...model, focused: true, opened: context.disabled !== true },
  commands: [],
  outMessages: model.focused ? [] : [OutMessage.Focused()]
})

const locked = (context: TimePickerContext) => context.readOnly === true || context.disabled === true

const editing = (message: Message) =>
  ["Typed", "PressedKey", "PressedAmPmKey", "ChoseNumber", "ChoseAmPm", "Pasted", "Cleared", "ChosePreset"].includes(
    message._tag
  )

export const update = (model: Model, message: Message, context: TimePickerContext = {}): Result => {
  if (locked(context) && editing(message)) return { model, commands: [], outMessages: [] }

  return Message.match(message, {
    Typed: ({ field, text }) => typed(model, field, text, context),
    PressedKey: ({ field, key, wholeSelected }) => keyed(model, field, key, wholeSelected, context),
    PressedAmPmKey: ({ key, code }) => amPmKey(model, key, code, context),
    ChoseNumber: ({ field, value }) => setNumber(model, field, value, context),
    ChoseAmPm: ({ value }) => changedField(model, { ...model.fields, amPm: value }, "amPm", context),
    LeftHours: ({ text }) =>
      formatOf(context) === "12h" && text !== "" && Number.parseInt(text, 10) === 0
        ? setNumber(model, "hours", 12, context)
        : { model, commands: [], outMessages: [] },
    Pasted: ({ text }) => pasted(model, text, context),
    FocusedField: () => focused(model, context),
    LeftFields: () => left(model, context),
    ClickedRoot: () => ({ ...focused(model, context), commands: [focus(model, "hours")] }),
    Cleared: () => ({
      model: { ...model, fields: emptyFields, wasInvalid: true },
      commands: [focus(model, "hours")],
      outMessages: [OutMessage.Changed({ value: "" })]
    }),
    ChosePreset: ({ value }) => {
      const result = setTime(model, value, context)

      return context.closeDropdownOnPresetSelect === true
        ? { ...result, model: { ...result.model, opened: false } }
        : result
    },
    CompletedFocus: () => ({ model, commands: [], outMessages: [] })
  })
}

export const hiddenValue = (model: Model, context: TimePickerContext = {}): string =>
  Option.getOrElse(timeString(model.fields, options(context)), () => "")
