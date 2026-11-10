import { Option, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import * as Calendar from "../Calendar/model.ts"
import type { CalendarContext } from "../Calendar/model.ts"
import { formatDate, isInRange, isSameDay, normalize } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import { parseDateInput } from "../date/parse.ts"

export const Model = Schema.Struct({
  id: Schema.String,
  opened: Schema.Boolean,
  text: Schema.String,
  value: Schema.NullOr(Schema.String),
  calendar: Calendar.Model
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Typed: { text: Schema.String },
  Focused: {},
  Clicked: {},
  Blurred: {},
  PressedEscape: {},
  PickedDay: { date: Schema.String },
  ChosePreset: { value: Schema.NullOr(Schema.String) },
  Cleared: {},
  GotCalendar: { message: Calendar.Message },
  Anchored: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.NullOr(Schema.String) } })
export type OutMessage = typeof OutMessage.Type

export type DateInputContext = CalendarContext & {
  readonly valueFormat?: string
  readonly locale?: string
  readonly minDate?: DateString
  readonly maxDate?: DateString
  readonly clearable?: boolean
  readonly allowDeselect?: boolean
  readonly fixOnBlur?: boolean
  readonly dateParser?: (text: string) => Option.Option<DateString>
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const display = (value: DateString | null, context: DateInputContext) =>
  value === null ? "" : formatDate(value, context.valueFormat ?? "MMMM D, YYYY", context.locale ?? "en")

export const init = (
  config: { readonly id: string; readonly today: DateString; readonly value?: DateString | null },
  context: DateInputContext = {}
): Model => {
  const value = config.value === undefined || config.value === null ? null : normalize(config.value)

  return {
    id: config.id,
    opened: false,
    text: display(value, context),
    value,
    calendar: Calendar.init({ id: `${config.id}-calendar`, date: value ?? config.today }, context)
  }
}

const deselects = (context: DateInputContext) => context.allowDeselect ?? context.clearable === true

const parse = (text: string, context: DateInputContext) =>
  (
    context.dateParser ??
    ((typed: string) => parseDateInput(typed, context.valueFormat ?? "MMMM D, YYYY", context.locale ?? "en"))
  )(text)

const changed = (model: Model, value: DateString | null): Result => ({
  model: { ...model, value },
  outMessages: [OutMessage.Changed({ value })]
})

const typed = (model: Model, text: string, context: DateInputContext): Result => {
  const opened = { ...model, text, opened: true }
  if (text.trim() === "" && (context.allowDeselect === true || context.clearable === true)) return changed(opened, null)
  const valid = Option.filter(parse(text, context), (date) => isInRange(date, context.minDate, context.maxDate))

  return Option.match(valid, {
    onNone: () => ({ model: opened, outMessages: [] }),
    onSome: (date) => changed({ ...opened, calendar: Calendar.setDate(opened.calendar, date) }, date)
  })
}

const chosen = (model: Model, value: DateString | null, context: DateInputContext): Result => {
  const result = changed({ ...model, opened: false, text: display(value, context) }, value)
  if (value === null) return result

  return { ...result, model: { ...result.model, calendar: Calendar.setDate(result.model.calendar, value) } }
}

const picked = (model: Model, date: DateString, context: DateInputContext): Result => {
  const same = model.value !== null && isSameDay(model.value, date)

  return chosen(model, deselects(context) && same ? null : date, context)
}

export const update = (model: Model, message: Message, context: DateInputContext = {}): Result =>
  Message.match(message, {
    Typed: ({ text }) => typed(model, text, context),
    Focused: () => ({ model: { ...model, opened: true }, outMessages: [] }),
    Clicked: () => ({ model: { ...model, opened: true }, outMessages: [] }),
    Blurred: () => ({
      model: {
        ...model,
        opened: false,
        text: context.fixOnBlur === false ? model.text : display(model.value, context)
      },
      outMessages: []
    }),
    PressedEscape: () => ({ model: { ...model, opened: false }, outMessages: [] }),
    PickedDay: ({ date }) => picked(model, normalize(date), context),
    ChosePreset: ({ value }) => chosen(model, value === null ? null : normalize(value), context),
    Cleared: () => chosen(model, null, context),
    GotCalendar: ({ message: inner }) => ({
      model: { ...model, calendar: Calendar.update(model.calendar, inner, context).model },
      outMessages: []
    }),
    Anchored: () => ({ model, outMessages: [] })
  })

export const setValue = (model: Model, value: DateString | null, context: DateInputContext = {}): Model => ({
  ...model,
  value,
  text: display(value, context),
  ...(value === null ? {} : { calendar: Calendar.setDate(model.calendar, value) })
})
