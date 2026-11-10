import { Array as Arr, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import { addMonths, addYears, normalize, startOfMonth } from "../date/date.ts"
import type { DateString } from "../date/date.ts"

export const CalendarLevel = Schema.Literals(["month", "year", "decade"])
export type CalendarLevel = typeof CalendarLevel.Type

export const Model = Schema.Struct({ id: Schema.String, date: Schema.String, level: CalendarLevel })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Previous: {},
  Next: {},
  LevelUp: {},
  ChoseMonth: { month: Schema.String },
  ChoseYear: { year: Schema.String },
  PressedPageKey: { key: Schema.String, ctrlKey: Schema.Boolean, shiftKey: Schema.Boolean }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  DateChanged: { date: Schema.String },
  LevelChanged: { level: CalendarLevel },
  MonthSelected: { month: Schema.String },
  YearSelected: { year: Schema.String }
})
export type OutMessage = typeof OutMessage.Type

export type CalendarContext = {
  readonly minLevel?: CalendarLevel
  readonly maxLevel?: CalendarLevel
  readonly numberOfColumns?: number
  readonly columnsToScroll?: number
}

export type Update = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const order: ReadonlyArray<CalendarLevel> = ["month", "year", "decade"]

const rank = (level: CalendarLevel) => order.indexOf(level)

export const clampLevel = (level: CalendarLevel, context: CalendarContext): CalendarLevel => {
  const low = rank(context.minLevel ?? "month")
  const high = rank(context.maxLevel ?? "decade")

  return Arr.getUnsafe(order, Math.min(Math.max(rank(level), low), high))
}

export const init = (
  config: { readonly id: string; readonly date: DateString; readonly level?: CalendarLevel },
  context: CalendarContext = {}
): Model => ({
  id: config.id,
  date: startOfMonth(normalize(config.date)),
  level: clampLevel(config.level ?? "month", context)
})

const columnsToScroll = (context: CalendarContext) => context.columnsToScroll ?? context.numberOfColumns ?? 1

const step = (model: Model, context: CalendarContext, direction: 1 | -1): DateString => {
  const columns = columnsToScroll(context) * direction
  if (model.level === "month") return addMonths(model.date, columns)

  return addYears(model.date, model.level === "year" ? columns : columns * 10)
}

const moved = (model: Model, date: DateString): Update => ({
  model: { ...model, date },
  outMessages: [OutMessage.DateChanged({ date })]
})

const leveled = (model: Model, level: CalendarLevel, date: DateString, extra: ReadonlyArray<OutMessage>): Update => {
  if (level === model.level) return { model: { ...model, date }, outMessages: extra }

  return { model: { ...model, level, date }, outMessages: [...extra, OutMessage.LevelChanged({ level })] }
}

const pageKey = (
  model: Model,
  context: CalendarContext,
  key: { readonly key: string; readonly ctrlKey: boolean; readonly shiftKey: boolean }
): Update => {
  if (key.key.toLowerCase() === "y")
    return leveled(model, clampLevel(model.level === "month" ? "year" : model.level, context), model.date, [])
  if (!key.ctrlKey) return { model, outMessages: [] }
  const years = key.shiftKey ? 10 : 1
  if (key.key === "ArrowUp") return moved(model, addYears(model.date, -years))
  if (key.key === "ArrowDown") return moved(model, addYears(model.date, years))

  return { model, outMessages: [] }
}

export const update = (model: Model, message: Message, context: CalendarContext = {}): Update =>
  Message.match(message, {
    Previous: () => moved(model, step(model, context, -1)),
    Next: () => moved(model, step(model, context, 1)),
    LevelUp: () => leveled(model, clampLevel(model.level === "month" ? "year" : "decade", context), model.date, []),
    ChoseMonth: ({ month }) =>
      leveled(
        model,
        clampLevel("month", context),
        clampLevel("month", context) === "month" ? startOfMonth(month) : model.date,
        [OutMessage.MonthSelected({ month: normalize(month) })]
      ),
    ChoseYear: ({ year }) =>
      leveled(
        model,
        clampLevel("year", context),
        clampLevel("year", context) === "year" ? normalize(year) : model.date,
        [OutMessage.YearSelected({ year: normalize(year) })]
      ),
    PressedPageKey: (key) => pageKey(model, context, key)
  })

export const setDate = (model: Model, date: DateString): Model => ({ ...model, date: startOfMonth(normalize(date)) })
