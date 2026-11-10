import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { monthEvents } from "../../MonthView/demos/events.ts"
import { schedule } from "../../Schedule.ts"

export const Model = Schema.Struct({ selected: Schema.String, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  SelectedDay: { date: Schema.String },
  ClickedWeek: { date: Schema.String },
  ClickedYear: {},
  ClickedEvent: { title: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ selected: "2025-01-06", log: "Pick a day" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    SelectedDay: ({ date }) => ({ selected: date, log: `Selected ${date}` }),
    ClickedWeek: ({ date }) => ({ ...model, log: `Week of ${date}` }),
    ClickedYear: () => ({ ...model, log: "Back to the year" }),
    ClickedEvent: ({ title }) => ({ ...model, log: `Opened ${title}` })
  }),
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 420,
    children: [
      schedule.MobileMonthView(h, {
        date: "2025-01-15",
        selectedDate: model.selected,
        events: monthEvents,
        now: "2025-01-15 10:00:00",
        withWeekNumbers: true,
        onDayClick: (date) => Message.SelectedDay({ date }),
        onWeekNumberClick: (date) => Message.ClickedWeek({ date }),
        onYearClick: Message.ClickedYear(),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
