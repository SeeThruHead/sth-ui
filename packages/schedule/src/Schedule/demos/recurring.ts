import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import type { ScheduleEvent } from "../../events.ts"
import { schedule } from "../../Schedule.ts"

export const recurringEvents: ReadonlyArray<ScheduleEvent> = [
  {
    id: "weekly-series",
    title: "Weekly planning",
    start: "2024-01-15 10:00:00",
    end: "2024-01-15 11:00:00",
    color: "blue",
    recurrence: { rrule: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=16", exdate: ["2024-01-22 10:00:00"] }
  },
  {
    id: "weekly-series-override",
    title: "Weekly planning (moved)",
    start: "2024-01-17 16:00:00",
    end: "2024-01-17 17:00:00",
    color: "grape",
    recurringEventId: "weekly-series",
    recurrenceId: "2024-01-17 10:00:00"
  },
  { id: "one-off", title: "Dentist", start: "2024-01-18 09:00:00", end: "2024-01-18 10:00:00", color: "teal" }
]

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Noop: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({})

export const update = (
  model: Model
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({ model, commands: [] })

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.WeekView(h, {
        date: "2024-01-17",
        events: recurringEvents,
        withHeader: false,
        startTime: "08:00:00",
        endTime: "18:00:00",
        maxHeight: 360
      }),
      schedule.MonthView(h, { date: "2024-01-17", events: recurringEvents, withHeader: false, mode: "static" })
    ]
  })
