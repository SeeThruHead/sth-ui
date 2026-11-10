import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { weekEvents } from "../../WeekView/demos/events.ts"
import { schedule } from "../../Schedule.ts"
import * as ScheduleModel from "../model.ts"

export const Model = Schema.Struct({ schedule: ScheduleModel.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSchedule: { message: ScheduleModel.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ schedule: ScheduleModel.init({ id: "phone", date: "2025-01-15", view: "month" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { schedule: ScheduleModel.update(model.schedule, message.message, { events: weekEvents }).model },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 360,
    children: [
      schedule.Schedule(h, {
        model: model.schedule,
        toParentMessage: (message) => Message.GotSchedule({ message }),
        events: weekEvents,
        layout: "responsive",
        mobileMonthViewProps: { withWeekNumbers: true }
      })
    ]
  })
