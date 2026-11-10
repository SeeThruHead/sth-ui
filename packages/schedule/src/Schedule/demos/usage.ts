import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { weekEvents } from "../../WeekView/demos/events.ts"
import { schedule } from "../../Schedule.ts"
import * as ScheduleModel from "../model.ts"

export const Model = Schema.Struct({ schedule: ScheduleModel.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSchedule: { message: ScheduleModel.Message },
  ClickedEvent: { title: Schema.String },
  ClickedDay: { date: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  schedule: ScheduleModel.init({ id: "schedule", date: "2025-01-15" }),
  log: "Switch views from the header"
})

const describe = (out: ScheduleModel.OutMessage) => {
  if (out._tag === "DateChanged") return `Date ${out.date}`
  if (out._tag === "ViewChanged") return `View ${out.view}`

  return out._tag
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ClickedEvent: ({ title }) => ({ model: { ...model, log: `Opened ${title}` }, commands: [] }),
    ClickedDay: ({ date }) => ({ model: { ...model, log: `Day ${date}` }, commands: [] }),
    GotSchedule: ({ message: inner }) => {
      const result = ScheduleModel.update(model.schedule, inner, { events: weekEvents, intervalMinutes: 60 })

      return {
        model: { schedule: result.model, log: result.outMessages.map(describe).join(", ") || model.log },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSchedule({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.Schedule(h, {
        model: model.schedule,
        toParentMessage: (message) => Message.GotSchedule({ message }),
        events: weekEvents,
        now: "2025-01-15 10:30:00",
        withEventsDragAndDrop: true,
        withInteractiveBackgroundEvents: true,
        withEventResize: true,
        withAgenda: true,
        onEventClick: (event) => Message.ClickedEvent({ title: event.title }),
        onDayClick: (date) => Message.ClickedDay({ date }),
        weekViewProps: { startTime: "08:00:00", endTime: "18:00:00", maxHeight: 420 },
        dayViewProps: { startTime: "08:00:00", endTime: "18:00:00", maxHeight: 420 },
        monthViewProps: { withWeekendDays: true }
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
