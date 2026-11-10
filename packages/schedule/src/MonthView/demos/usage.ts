import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Interaction from "../../DayView/interaction.ts"
import * as View from "../../DayView/model.ts"
import { ScheduleEvent } from "../../events.ts"
import { schedule } from "../../Schedule.ts"
import { monthEvents } from "./events.ts"

export const Model = Schema.Struct({
  date: Schema.String,
  events: Schema.Array(ScheduleEvent),
  view: View.Model,
  log: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedDay: { date: Schema.String },
  ClickedWeek: { date: Schema.String },
  ClickedEvent: { title: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  date: "2025-01-15",
  events: monthEvents,
  view: View.init({ id: "month" }),
  log: "Drag an event to another day"
})

const moved = (model: Model, id: string | number, start: string, end: string) =>
  model.events.map((event) => (event.id === id ? { ...event, start, end } : event))

const apply = (model: Model, out: View.OutMessage): Model =>
  Interaction.OutMessage.match(out, {
    EventDropped: ({ eventId, newStart, newEnd }) => ({
      ...model,
      events: moved(model, eventId, newStart, newEnd),
      log: `Moved to ${newStart}`
    }),
    EventResized: () => model,
    SlotsSelected: ({ rangeStart, rangeEnd }) => ({
      ...model,
      events: [
        ...model.events,
        { id: `new-${rangeStart}`, title: "New event", start: rangeStart, end: rangeEnd, color: "pink" }
      ],
      log: `Created ${rangeStart} to ${rangeEnd}`
    }),
    ExternalEventDropped: ({ start }) => ({ ...model, log: `Dropped at ${start}` }),
    DropRejected: () => ({ ...model, log: "Drop rejected" }),
    ResizeRejected: () => model
  })

const logged = (model: Model, log: string) => ({ model: { ...model, log }, commands: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ChangedDate: ({ date }) => ({ model: { ...model, date, log: `Showing ${date}` }, commands: [] }),
    ChangedView: ({ view }) => logged(model, `Switch to ${view}`),
    ClickedDay: ({ date }) => logged(model, `Day ${date}`),
    ClickedWeek: ({ date }) => logged(model, `Week of ${date}`),
    ClickedEvent: ({ title }) => logged(model, `Opened ${title}`),
    GotView: ({ message: inner }) => {
      const result = View.update(model.view, inner, { events: model.events })

      return {
        model: result.outMessages.reduce(apply, { ...model, view: result.model }),
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotView({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.MonthView(h, {
        date: model.date,
        events: model.events,
        now: "2025-01-15 10:00:00",
        withWeekNumbers: true,
        withEventsDragAndDrop: true,
        withDragSlotSelect: true,
        withExternalEventDrop: true,
        withInteractiveBackgroundEvents: true,
        withAgenda: true,
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        onDateChange: (date) => Message.ChangedDate({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level }),
        onDayClick: (date) => Message.ClickedDay({ date }),
        onWeekNumberClick: (date) => Message.ClickedWeek({ date }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
