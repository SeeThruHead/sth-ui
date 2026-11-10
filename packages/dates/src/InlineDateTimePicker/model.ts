import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import type { DateString } from "../date/date.ts"
import * as Picker from "../picker/model.ts"
import type { PickerOptions } from "../picker/model.ts"
import type { PickerType } from "../picker/selection.ts"
import { assignTime, clampDateTime, datePart, timeLimitOn, timePart, toDateTime } from "../time/datetime.ts"
import type { DateTimeString } from "../time/datetime.ts"
import { fieldId } from "../TimePicker/model.ts"
import * as TimePicker from "../TimePicker/model.ts"
import type { TimePickerContext } from "../TimePicker/model.ts"
import { FocusField } from "../TimePicker/focus.ts"

export const Model = Schema.Struct({
  id: Schema.String,
  picker: Picker.Model,
  start: TimePicker.Model,
  end: TimePicker.Model,
  startTime: Schema.String,
  endTime: Schema.String,
  value: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotPicker: { message: Picker.Message },
  GotStart: { message: TimePicker.Message },
  GotEnd: { message: TimePicker.Message },
  Submitted: {},
  CompletedFocus: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { value: Schema.Array(Schema.String) }, Submitted: {} })
export type OutMessage = typeof OutMessage.Type

export type DateTimeContext = Omit<PickerOptions, "minLevel"> & {
  readonly minDate?: DateTimeString
  readonly maxDate?: DateTimeString
  readonly withSeconds?: boolean
  readonly defaultTimeValue?: string
  readonly timePicker?: Omit<TimePickerContext, "min" | "max" | "withSeconds">
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const formatTime = (value: Option.Option<DateTimeString>, context: DateTimeContext) =>
  Option.match(value, {
    onNone: () => "",
    onSome: (time) => (context.withSeconds === true ? timePart(time) : timePart(time).slice(0, 5))
  })

const at = (value: ReadonlyArray<DateTimeString>, index: number) => Option.fromNullishOr(value[index])

const clockOf = (context: DateTimeContext): TimePickerContext => ({
  ...context.timePicker,
  withSeconds: context.withSeconds === true
})

export const timeContext = (model: Model, which: "start" | "end", context: DateTimeContext): TimePickerContext => {
  const current = at(model.value, which === "start" ? 0 : 1)
  const min = timeLimitOn(context.minDate, current)
  const max = timeLimitOn(context.maxDate, current)

  return {
    ...context.timePicker,
    withSeconds: context.withSeconds === true,
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max })
  }
}

export const pickerOptions = (context: DateTimeContext): PickerOptions => {
  const {
    minDate: _minDate,
    maxDate: _maxDate,
    withSeconds: _withSeconds,
    defaultTimeValue: _time,
    timePicker: _timePicker,
    ...options
  } = context

  return options
}

export const dateLimits = (context: DateTimeContext) => ({
  ...(context.minDate === undefined ? {} : { minDate: datePart(context.minDate) }),
  ...(context.maxDate === undefined ? {} : { maxDate: datePart(context.maxDate) })
})

export const init = (
  config: {
    readonly id: string
    readonly today: DateString
    readonly type?: Exclude<PickerType, "multiple">
    readonly value?: ReadonlyArray<DateTimeString>
    readonly date?: DateString
  },
  context: DateTimeContext = {}
): Model => {
  const value = config.value ?? []
  const startTime = context.defaultTimeValue ?? formatTime(at(value, 0), context)
  const endTime = context.defaultTimeValue ?? (config.type === "range" ? formatTime(at(value, 1), context) : "")
  const blank: Model = {
    id: config.id,
    picker: Picker.init({
      id: `${config.id}-dates`,
      today: config.today,
      type: config.type ?? "default",
      value: value.map(datePart),
      ...(config.date === undefined ? {} : { date: config.date })
    }),
    start: TimePicker.init({ id: `${config.id}-start`, value: startTime }, clockOf(context)),
    end: TimePicker.init({ id: `${config.id}-end`, value: endTime }, clockOf(context)),
    startTime,
    endTime,
    value
  }

  return blank
}

const synced = (model: Model, value: ReadonlyArray<DateTimeString>, context: DateTimeContext): Model => {
  const startTime = formatTime(at(value, 0), context)
  const endTime = formatTime(at(value, 1), context)
  const withSeconds = clockOf(context)

  return {
    ...model,
    value,
    picker: Picker.setValue(model.picker, value.map(datePart)),
    startTime,
    endTime,
    start: TimePicker.setValue(model.start, startTime, withSeconds),
    end: TimePicker.setValue(model.end, endTime, withSeconds)
  }
}

export const liftTime =
  (which: "start" | "end") =>
  (inner: TimePicker.Message): Message =>
    which === "start" ? Message.GotStart({ message: inner }) : Message.GotEnd({ message: inner })

export const completedFocus = (): Message => Message.CompletedFocus()

const focusStart = (model: Model): Command.Command<Message> =>
  Command.mapMessage(FocusField({ selector: `#${fieldId(model.start.id, "hours")}` }), completedFocus)

const placed = (date: DateString, time: string, context: DateTimeContext) => {
  const clamped = clampDateTime(toDateTime(date), context.minDate, context.maxDate)

  return time === "" ? clamped : assignTime(clamped, time)
}

const pickedDates = (model: Model, dates: ReadonlyArray<DateString>, context: DateTimeContext): Result => {
  const fallback = context.defaultTimeValue ?? ""
  if (model.picker.selection.type !== "range") {
    return Option.match(Arr.head(dates), {
      onNone: () => ({ model, commands: [focusStart(model)], outMessages: [] }),
      onSome: (date) => {
        const value = [placed(date, model.startTime === "" ? fallback : model.startTime, context)]

        return {
          model: synced(model, value, context),
          commands: [focusStart(model)],
          outMessages: [OutMessage.Changed({ value })]
        }
      }
    })
  }
  const start = Option.map(at(dates, 0), (date) =>
    placed(date, model.startTime === "" ? fallback : model.startTime, context)
  )
  const end = Option.map(at(dates, 1), (date) => placed(date, model.endTime === "" ? fallback : model.endTime, context))
  const value = [...Option.toArray(start), ...Option.toArray(end)]
  const next = {
    ...synced(model, value, context),
    picker: { ...model.picker, selection: { ...model.picker.selection, value: dates } }
  }

  return {
    model: next,
    commands: dates.length === 2 ? [focusStart(model)] : [],
    outMessages: [OutMessage.Changed({ value })]
  }
}

const fromPicker = (model: Model, message: Picker.Message, context: DateTimeContext): Result => {
  const result = Picker.update(model.picker, message, { ...pickerOptions(context), ...dateLimits(context) })
  const next = { ...model, picker: result.model }
  const change = result.outMessages.find((out) => out._tag === "Changed")
  if (change?._tag !== "Changed") return { model: next, commands: [], outMessages: [] }

  return pickedDates(next, change.value, context)
}

const fromTime = (
  model: Model,
  which: "start" | "end",
  message: TimePicker.Message,
  context: DateTimeContext
): Result => {
  const index = which === "start" ? 0 : 1
  const result = TimePicker.update(model[which], message, timeContext(model, which, context))
  const commands = result.commands.map((command) => Command.mapMessage(command, liftTime(which)))
  const next = { ...model, [which]: result.model }
  const change = result.outMessages.find((out) => out._tag === "Changed")
  if (change?._tag !== "Changed") return { model: next, commands, outMessages: [] }
  const timed = { ...next, [which === "start" ? "startTime" : "endTime"]: change.value }
  const current = at(model.value, index)
  if (change.value === "" || Option.isNone(current)) return { model: timed, commands, outMessages: [] }
  const value = model.value.map((item, position) => (position === index ? assignTime(item, change.value) : item))

  return {
    model: { ...synced(timed, value, context), [which]: result.model },
    commands,
    outMessages: [OutMessage.Changed({ value })]
  }
}

export const update = (model: Model, message: Message, context: DateTimeContext = {}): Result =>
  Message.match(message, {
    GotPicker: ({ message: inner }) => fromPicker(model, inner, context),
    GotStart: ({ message: inner }) => fromTime(model, "start", inner, context),
    GotEnd: ({ message: inner }) => fromTime(model, "end", inner, context),
    Submitted: () => ({ model, commands: [], outMessages: [OutMessage.Submitted()] }),
    CompletedFocus: () => ({ model, commands: [], outMessages: [] })
  })

export const setValue = (model: Model, value: ReadonlyArray<DateTimeString>, context: DateTimeContext = {}): Model =>
  synced(model, value, context)
