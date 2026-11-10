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

export const weekBookings: ReadonlyArray<EventData> = [
  {
    id: "retreat",
    title: "Retreat",
    start: "2025-01-13 00:00:00",
    end: "2025-01-15 00:00:00",
    color: "grape",
    resourceId: "orion"
  },
  {
    id: "standup",
    title: "Standup",
    start: "2025-01-13 09:00:00",
    end: "2025-01-13 10:00:00",
    color: "blue",
    resourceId: "lyra",
    recurrence: { rrule: "FREQ=DAILY;COUNT=5" }
  },
  {
    id: "pitch",
    title: "Pitch",
    start: "2025-01-15 11:00:00",
    end: "2025-01-15 12:00:00",
    color: "red",
    resourceId: "orion"
  },
  {
    id: "recording",
    title: "Recording",
    start: "2025-01-16 13:00:00",
    end: "2025-01-16 15:00:00",
    color: "orange",
    resourceId: 3
  }
]

export const Model = Schema.Struct({ events: Schema.Array(ScheduleEvent), view: View.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedEvent: { title: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  events: weekBookings,
  view: View.init({ id: "rooms-week" }),
  log: "Drag a booking to another day or room"
})

const apply = (model: Model, out: View.OutMessage): Model =>
  out._tag === "EventDropped"
    ? {
        ...model,
        events: model.events.map((event) =>
          event.id === out.eventId
            ? {
                ...event,
                start: out.newStart,
                end: out.newEnd,
                ...Option.match(out.resourceId, { onNone: () => ({}), onSome: (id) => ({ resourceId: id }) })
              }
            : event
        ),
        log: `Moved to ${out.newStart} in ${Option.getOrElse(Option.map(out.resourceId, String), () => "?")}`
      }
    : { ...model, log: out._tag }

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ChangedDate: ({ date }) => ({ model: { ...model, log: `Week of ${date}` }, commands: [] }),
    ChangedView: ({ view }) => ({ model: { ...model, log: `View ${view}` }, commands: [] }),
    ClickedEvent: ({ title }) => ({ model: { ...model, log: `Opened ${title}` }, commands: [] }),
    GotView: ({ message: inner }) => {
      const result = View.update(model.view, inner, {
        events: model.events,
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 120
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
      schedule.ResourcesWeekView(h, {
        date: "2025-01-15",
        resources: rooms,
        groups: floors,
        events: model.events,
        now: "2025-01-15 10:00:00",
        highlightToday: true,
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 120,
        slotWidth: 44,
        withWeekendDays: false,
        startScrollDateTime: "2025-01-15 10:00:00",
        withEventsDragAndDrop: true,
        withDragSlotSelect: true,
        onViewChange: (level) => Message.ChangedView({ view: level }),
        model: model.view,
        toParentMessage: (message) => Message.GotView({ message }),
        onDateChange: (date) => Message.ChangedDate({ date }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
