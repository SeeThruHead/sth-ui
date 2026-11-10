import { Array as Arr, Option, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import type { DateString } from "../date/date.ts"
import * as Calendar from "../Calendar/model.ts"
import type { CalendarContext, CalendarLevel } from "../Calendar/model.ts"
import { controlState, hover, leave, pick, PickerLevel, PickerType, Selection, selection } from "./selection.ts"
import type { SelectOptions } from "./selection.ts"

export const Model = Schema.Struct({ calendar: Calendar.Model, selection: Selection, level: PickerLevel })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotCalendar: { message: Calendar.Message },
  Picked: { date: Schema.String },
  Hovered: { date: Schema.String },
  Left: {},
  ChosePreset: { value: Schema.Array(Schema.String) }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Array(Schema.String) },
  GotCalendar: { message: Calendar.OutMessage }
})
export type OutMessage = typeof OutMessage.Type

export type PickerOptions = Omit<SelectOptions, "level"> & CalendarContext

export type Update = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const lowest: Readonly<Record<PickerLevel, CalendarLevel>> = { day: "month", month: "year", year: "decade" }

export const calendarContext = (model: Model, options: PickerOptions): CalendarContext => ({
  ...options,
  minLevel: lowest[model.level]
})

export const init = (config: {
  readonly id: string
  readonly level?: PickerLevel
  readonly type?: PickerType
  readonly value?: ReadonlyArray<DateString>
  readonly date?: DateString
  readonly today: DateString
  readonly calendarLevel?: CalendarLevel
}): Model => {
  const level = config.level ?? "day"
  const value = config.value ?? []
  const date = config.date ?? Option.getOrElse(Arr.head(value), () => config.today)

  return {
    calendar: Calendar.init(
      { id: config.id, date, ...(config.calendarLevel === undefined ? {} : { level: config.calendarLevel }) },
      { minLevel: lowest[level] }
    ),
    selection: selection(config.type ?? "default", value),
    level
  }
}

const select = (model: Model, next: Model["selection"]): Update => ({
  model: { ...model, selection: next },
  outMessages: [OutMessage.Changed({ value: next.value })]
})

const picking = (model: Model, options: PickerOptions, date: DateString) =>
  pick(model.selection, date, { ...options, level: model.level })

const pickedBy = (model: Model, out: Calendar.OutMessage) => {
  if (model.level === "month" && out._tag === "MonthSelected") return [out.month]
  if (model.level === "year" && out._tag === "YearSelected") return [out.year]

  return []
}

const fromCalendar = (model: Model, message: Calendar.Message, options: PickerOptions): Update => {
  const result = Calendar.update(model.calendar, message, calendarContext(model, options))
  const forwarded = result.outMessages.map((out) => OutMessage.GotCalendar({ message: out }))
  const picked = result.outMessages.flatMap((out) => pickedBy(model, out))
  const next = picked.reduce(
    (current, date) => pick(current, date, { ...options, level: model.level }),
    model.selection
  )
  const changed = picked.length > 0 ? [OutMessage.Changed({ value: next.value })] : []

  return { model: { ...model, calendar: result.model, selection: next }, outMessages: [...forwarded, ...changed] }
}

const preset = (model: Model, value: ReadonlyArray<DateString>): Update => {
  const base = select(model, selection(model.selection.type, value))
  const calendar = Arr.match(value, {
    onEmpty: () => model.calendar,
    onNonEmpty: ([first]) => ({ ...Calendar.setDate(model.calendar, first), level: lowest[model.level] })
  })

  return { ...base, model: { ...base.model, calendar } }
}

export const update = (model: Model, message: Message, options: PickerOptions = {}): Update =>
  Message.match(message, {
    GotCalendar: ({ message: inner }) => fromCalendar(model, inner, options),
    Picked: ({ date }) => select(model, picking(model, options, date)),
    Hovered: ({ date }) => ({ model: { ...model, selection: hover(model.selection, date) }, outMessages: [] }),
    Left: () => ({ model: { ...model, selection: leave(model.selection) }, outMessages: [] }),
    ChosePreset: ({ value }) => preset(model, value)
  })

export const setValue = (model: Model, value: ReadonlyArray<DateString>): Model => ({
  ...model,
  selection: selection(model.selection.type, value)
})

export const stateOf = (model: Model, date: DateString) => controlState(model.selection, date, { level: model.level })
