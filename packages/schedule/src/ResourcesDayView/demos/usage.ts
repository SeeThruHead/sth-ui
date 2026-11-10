import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Interaction from "../../DayView/interaction.ts"
import * as View from "../../DayView/model.ts"
import { ScheduleEvent } from "../../events.ts"
import { schedule } from "../../Schedule.ts"
import { day, floors, roomEvents, rooms } from "./data.ts"

export const Model = Schema.Struct({ events: Schema.Array(ScheduleEvent), view: View.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedSlot: { resource: Schema.String, start: Schema.String },
  ClickedEvent: { title: Schema.String },
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  events: roomEvents,
  view: View.init({ id: "rooms" }),
  log: "Drag a booking to another room or time"
})

const where = (resourceId: Interaction.Resource) =>
  Option.getOrElse(Option.map(resourceId, String), () => "the same room")

const apply = (model: Model, out: View.OutMessage): Model =>
  Interaction.OutMessage.match(out, {
    EventDropped: ({ eventId, newStart, newEnd, resourceId }) => ({
      ...model,
      events: model.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              start: newStart,
              end: newEnd,
              ...Option.match(resourceId, { onNone: () => ({}), onSome: (id) => ({ resourceId: id }) })
            }
          : event
      ),
      log: `Moved to ${newStart.slice(11, 16)} in ${where(resourceId)}`
    }),
    EventResized: ({ eventId, newStart, newEnd }) => ({
      ...model,
      events: model.events.map((event) => (event.id === eventId ? { ...event, start: newStart, end: newEnd } : event)),
      log: `Now ${newStart.slice(11, 16)} to ${newEnd.slice(11, 16)}`
    }),
    SlotsSelected: ({ rangeStart, rangeEnd, resourceId }) => ({
      ...model,
      log: `Selected ${rangeStart.slice(11, 16)} to ${rangeEnd.slice(11, 16)} in ${where(resourceId)}`
    }),
    ExternalEventDropped: ({ start, resourceId }) => ({
      ...model,
      log: `Dropped at ${start.slice(11, 16)} in ${where(resourceId)}`
    }),
    DropRejected: () => ({ ...model, log: "Drop rejected" }),
    ResizeRejected: () => ({ ...model, log: "Resize rejected" })
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ClickedSlot: ({ resource, start }) => ({
      model: { ...model, log: `Slot ${start.slice(11, 16)} in ${resource}` },
      commands: []
    }),
    ClickedEvent: ({ title }) => ({ model: { ...model, log: `Opened ${title}` }, commands: [] }),
    ChangedDate: ({ date }) => ({ model: { ...model, log: `Date ${date}` }, commands: [] }),
    ChangedView: ({ view }) => ({ model: { ...model, log: `View ${view}` }, commands: [] }),
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
      schedule.ResourcesDayView(h, {
        date: day,
        resources: rooms,
        groups: floors,
        events: model.events,
        now: `${day} 10:15:00`,
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 30,
        slotWidth: 60,
        highlightBusinessHours: true,
        startScrollTime: "09:00:00",
        withEventsDragAndDrop: true,
        withEventResize: true,
        withDragSlotSelect: true,
        withExternalEventDrop: true,
        withInteractiveBackgroundEvents: true,
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        onTimeSlotClick: ({ resourceId, slotStart }) =>
          Message.ClickedSlot({ resource: String(resourceId), start: slotStart }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title }),
        onDateChange: (date) => Message.ChangedDate({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
