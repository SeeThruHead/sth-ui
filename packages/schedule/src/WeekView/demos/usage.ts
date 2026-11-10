import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { ScheduleEvent } from "../../events.ts"
import * as Interaction from "../../DayView/interaction.ts"
import * as View from "../../DayView/model.ts"
import { schedule } from "../../Schedule.ts"
import { weekEvents } from "./events.ts"

export const Model = Schema.Struct({
  date: Schema.String,
  events: Schema.Array(ScheduleEvent),
  view: View.Model,
  log: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  OpenedDay: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedSlot: { start: Schema.String },
  ClickedAllDay: { date: Schema.String },
  ClickedEvent: { title: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  date: "2025-01-15",
  events: weekEvents,
  view: View.init({ id: "week" }),
  log: "Drag, resize or click"
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
    EventResized: ({ eventId, newStart, newEnd }) => ({
      ...model,
      events: moved(model, eventId, newStart, newEnd),
      log: `Resized to ${newEnd}`
    }),
    SlotsSelected: ({ rangeStart, rangeEnd }) => ({
      ...model,
      events: [
        ...model.events,
        { id: `new-${rangeStart}`, title: "New event", start: rangeStart, end: rangeEnd, color: "pink" }
      ],
      log: `Created ${rangeStart}`
    }),
    ExternalEventDropped: ({ start }) => ({ ...model, log: `Dropped at ${start}` }),
    DropRejected: () => ({ ...model, log: "Drop rejected" }),
    ResizeRejected: () => ({ ...model, log: "Resize rejected" })
  })

const logged = (model: Model, log: string) => ({ model: { ...model, log }, commands: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ChangedDate: ({ date }) => ({ model: { ...model, date, log: `Week of ${date}` }, commands: [] }),
    OpenedDay: ({ date }) => logged(model, `Open ${date}`),
    ChangedView: ({ view }) => logged(model, `Switch to ${view}`),
    ClickedSlot: ({ start }) => logged(model, `Slot at ${start}`),
    ClickedAllDay: ({ date }) => logged(model, `All day on ${date}`),
    ClickedEvent: ({ title }) => logged(model, `Opened ${title}`),
    GotView: ({ message: inner }) => {
      const result = View.update(model.view, inner, {
        events: model.events,
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 30,
        preventEventOverlap: true
      })

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
      schedule.WeekView(h, {
        date: model.date,
        events: model.events,
        now: "2025-01-15 10:30:00",
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 30,
        highlightToday: true,
        highlightBusinessHours: true,
        maxHeight: 460,
        startScrollTime: "09:00:00",
        withEventsDragAndDrop: true,
        withEventResize: true,
        withDragSlotSelect: true,
        withExternalEventDrop: true,
        withInteractiveBackgroundEvents: true,
        withAgenda: true,
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        onDateChange: (date) => Message.ChangedDate({ date }),
        onDayClick: (date) => Message.OpenedDay({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level }),
        onTimeSlotClick: ({ slotStart }) => Message.ClickedSlot({ start: slotStart }),
        onAllDaySlotClick: (date) => Message.ClickedAllDay({ date }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
