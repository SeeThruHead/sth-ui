import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as View from "../../DayView/model.ts"
import type { ScheduleEvent as EventData } from "../../events.ts"
import { ScheduleEvent } from "../../events.ts"
import { schedule } from "../../Schedule.ts"
import { floors, rooms } from "../../ResourcesDayView/demos/data.ts"

export const monthBookings: ReadonlyArray<EventData> = [
  {
    id: "conference",
    title: "Conference",
    start: "2025-01-06 09:00:00",
    end: "2025-01-09 17:00:00",
    color: "grape",
    resourceId: "orion"
  },
  {
    id: "training",
    title: "Training",
    start: "2025-01-07 09:00:00",
    end: "2025-01-07 12:00:00",
    color: "teal",
    resourceId: "orion"
  },
  {
    id: "audit",
    title: "Audit",
    start: "2025-01-07 13:00:00",
    end: "2025-01-07 15:00:00",
    color: "red",
    resourceId: "orion"
  },
  {
    id: "sprint",
    title: "Sprint",
    start: "2025-01-13 00:00:00",
    end: "2025-01-25 00:00:00",
    color: "blue",
    resourceId: "lyra"
  },
  { id: 5, title: "Shoot", start: "2025-01-20 10:00:00", end: "2025-01-20 16:00:00", color: "orange", resourceId: 3 },
  {
    id: "closed",
    title: "Closed",
    start: "2025-01-01 00:00:00",
    end: "2025-01-01 23:59:59",
    color: "gray",
    resourceId: "desk",
    display: "background"
  }
]

export const Model = Schema.Struct({ events: Schema.Array(ScheduleEvent), view: View.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedDay: { cell: Schema.String },
  ClickedEvent: { title: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  events: monthBookings,
  view: View.init({ id: "rooms-month" }),
  log: "Drag or stretch a booking"
})

const placed = (
  model: Model,
  id: string | number,
  start: string,
  end: string,
  resourceId: Option.Option<string | number>
) =>
  model.events.map((event) =>
    event.id === id
      ? {
          ...event,
          start,
          end,
          ...Option.match(resourceId, { onNone: () => ({}), onSome: (resource) => ({ resourceId: resource }) })
        }
      : event
  )

const apply = (model: Model, out: View.OutMessage): Model => {
  if (out._tag === "EventDropped")
    return {
      ...model,
      events: placed(model, out.eventId, out.newStart, out.newEnd, out.resourceId),
      log: `Moved to ${out.newStart}`
    }
  if (out._tag === "EventResized")
    return {
      ...model,
      events: placed(model, out.eventId, out.newStart, out.newEnd, Option.none()),
      log: `Now until ${out.newEnd}`
    }
  if (out._tag === "SlotsSelected") return { ...model, log: `Selected ${out.rangeStart} to ${out.rangeEnd}` }

  return { ...model, log: out._tag }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ChangedDate: ({ date }) => ({ model: { ...model, log: `Month of ${date}` }, commands: [] }),
    ChangedView: ({ view }) => ({ model: { ...model, log: `View ${view}` }, commands: [] }),
    ClickedDay: ({ cell }) => ({ model: { ...model, log: `Cell ${cell}` }, commands: [] }),
    ClickedEvent: ({ title }) => ({ model: { ...model, log: `Opened ${title}` }, commands: [] }),
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
      schedule.ResourcesMonthView(h, {
        date: "2025-01-15",
        resources: rooms,
        groups: floors,
        events: model.events,
        now: "2025-01-15 10:00:00",
        dayWidth: 44,
        startScrollDate: "2025-01-05",
        withEventsDragAndDrop: true,
        withEventResize: true,
        withDragSlotSelect: true,
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        onDateChange: (date) => Message.ChangedDate({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level }),
        onDayClick: ({ resourceId, date }) => Message.ClickedDay({ cell: `${String(resourceId)} ${date}` }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
