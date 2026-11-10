import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dayEvents } from "../../DayView/demos/events.ts"
import { schedule } from "../../Schedule.ts"

export const Model = Schema.Struct({ log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ClickedEvent: { title: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ log: "Click an event" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { log: `Opened ${message.title}` },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      schedule.AgendaView(h, {
        rangeStart: "2025-01-14",
        rangeEnd: "2025-01-16",
        events: dayEvents,
        onEventClick: (event) => Message.ClickedEvent({ title: event.title })
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
