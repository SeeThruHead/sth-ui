import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { schedule } from "../../Schedule.ts"
import * as DayView from "../model.ts"
import { day, dayEvents } from "./events.ts"

export const Model = Schema.Struct({ date: Schema.String, log: Schema.String, day: DayView.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: Schema.String },
  ClickedSlot: { start: Schema.String },
  ClickedAllDay: { date: Schema.String },
  ClickedEvent: { title: Schema.String },
  GotDayView: { message: DayView.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ date: day, log: "Click a slot or an event", day: DayView.init({ id: "usage" }) })

const gotDayView = (inner: DayView.Message): Message => Message.GotDayView({ message: inner })

const logged = (model: Model, log: string) => ({ model: { ...model, log }, commands: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ChangedDate: ({ date }) => ({ model: { ...model, date, log: `Showing ${date}` }, commands: [] }),
    ChangedView: ({ view }) => logged(model, `Switch to the ${view} view`),
    ClickedSlot: ({ start }) => logged(model, `Slot at ${start}`),
    ClickedAllDay: ({ date }) => logged(model, `All day on ${date}`),
    ClickedEvent: ({ title }) => logged(model, `Opened ${title}`),
    GotDayView: ({ message: inner }) => {
      const result = DayView.update(model.day, inner, { events: dayEvents })

      return {
        model: { ...model, day: result.model },
        commands: result.commands.map((command) => Command.mapMessage(command, gotDayView))
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.DayView(h, {
        date: model.date,
        events: dayEvents,
        now: `${day} 10:30:00`,
        startTime: "08:00:00",
        endTime: "18:00:00",
        highlightBusinessHours: true,
        maxHeight: 420,
        onDateChange: (date) => Message.ChangedDate({ date }),
        onViewChange: (level) => Message.ChangedView({ view: level }),
        onTimeSlotClick: ({ slotStart }) => Message.ClickedSlot({ start: slotStart }),
        onAllDaySlotClick: (date) => Message.ClickedAllDay({ date }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title }),
        withEventsDragAndDrop: true,
        withEventResize: true,
        startScrollTime: "09:00:00",
        withInteractiveBackgroundEvents: true,
        withAgenda: true,
        model: model.day,
        toParentMessage: (inner) => Message.GotDayView({ message: inner })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
