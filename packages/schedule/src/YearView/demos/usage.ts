import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { monthEvents } from "../../MonthView/demos/events.ts"
import { schedule } from "../../Schedule.ts"

export const Model = Schema.Struct({ date: Schema.String, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedDay: { date: Schema.String },
  ClickedWeek: { date: Schema.String },
  ClickedMonth: { date: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ date: "2025-01-15", log: "Click a day, week or month" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    ChangedDate: ({ date }) => ({ date, log: `Showing ${date}` }),
    ChangedView: ({ view }) => ({ ...model, log: `Switch to ${view}` }),
    ClickedDay: ({ date }) => ({ ...model, log: `Day ${date}` }),
    ClickedWeek: ({ date }) => ({ ...model, log: `Week of ${date}` }),
    ClickedMonth: ({ date }) => ({ ...model, log: `Month of ${date}` })
  }),
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.YearView(h, {
        date: model.date,
        events: monthEvents,
        now: "2025-01-15 10:00:00",
        withWeekNumbers: true,
        onDateChange: (date) => Message.ChangedDate({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level }),
        onDayClick: (date) => Message.ClickedDay({ date }),
        onWeekNumberClick: (date) => Message.ClickedWeek({ date }),
        onMonthClick: (date) => Message.ClickedMonth({ date })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
