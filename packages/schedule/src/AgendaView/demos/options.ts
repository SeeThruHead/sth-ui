import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dayEvents } from "../../DayView/demos/events.ts"
import { schedule } from "../../Schedule.ts"

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Noop: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({})

export const update = (
  model: Model
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model,
  commands: []
})

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    children: [
      schedule.AgendaView(h, {
        rangeStart: "2025-01-15",
        rangeEnd: "2025-01-15",
        events: dayEvents,
        mode: "static",
        radius: "lg",
        locale: "en",
        headerFormat: "MMM D",
        dateHeaderFormat: (value) => `Day ${value.slice(8, 10)}`,
        recurrenceExpansionLimit: 5,
        onEventClick: () => Message.Noop(),
        renderEvent: (event, { attributes, children }) =>
          h.div([...attributes, h.DataAttribute("custom", String(event.id))], children)
      }),
      schedule.AgendaView(h, {
        rangeStart: "2025-03-01",
        rangeEnd: "2025-03-07",
        labels: { noEvents: "Nothing planned" }
      })
    ]
  })
