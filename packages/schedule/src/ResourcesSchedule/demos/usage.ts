import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { floors, rooms } from "../../ResourcesDayView/demos/data.ts"
import { weekBookings } from "../../ResourcesWeekView/demos/usage.ts"
import * as ScheduleModel from "../../Schedule/model.ts"
import { schedule } from "../../Schedule.ts"

export const Model = Schema.Struct({ schedule: ScheduleModel.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSchedule: { message: ScheduleModel.Message },
  ClickedSlot: { start: Schema.String },
  ClickedDay: { date: Schema.String },
  ClickedEvent: { title: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  schedule: ScheduleModel.init({ id: "resources", date: "2025-01-15", view: "day" }),
  log: "Switch views from the header"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ClickedSlot: ({ start }) => ({ model: { ...model, log: `Slot ${start}` }, commands: [] }),
    ClickedDay: ({ date }) => ({ model: { ...model, log: `Day ${date}` }, commands: [] }),
    ClickedEvent: ({ title }) => ({ model: { ...model, log: `Opened ${title}` }, commands: [] }),
    GotSchedule: ({ message: inner }) => {
      const result = ScheduleModel.update(model.schedule, inner, {
        events: weekBookings,
        startTime: "08:00:00",
        endTime: "18:00:00",
        intervalMinutes: 60
      })

      return {
        model: { schedule: result.model, log: result.outMessages.map((out) => out._tag).join(", ") || model.log },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSchedule({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.ResourcesSchedule(h, {
        model: model.schedule,
        toParentMessage: (message) => Message.GotSchedule({ message }),
        resources: rooms,
        groups: floors,
        events: weekBookings,
        now: "2025-01-15 10:00:00",
        withEventsDragAndDrop: true,
        withEventResize: true,
        withInteractiveBackgroundEvents: true,
        onTimeSlotClick: ({ slotStart }) => Message.ClickedSlot({ start: slotStart }),
        onDayClick: ({ date }) => Message.ClickedDay({ date }),
        onEventClick: (event) => Message.ClickedEvent({ title: event.title }),
        dayViewProps: { startTime: "08:00:00", endTime: "18:00:00", slotWidth: 60 },
        weekViewProps: { startTime: "08:00:00", endTime: "18:00:00", intervalMinutes: 120, slotWidth: 40 },
        monthViewProps: { dayWidth: 40 }
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
