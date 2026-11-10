import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as Calendar from "../model.ts"

export const Model = Schema.Struct({
  calendar: Calendar.Model,
  picked: Schema.String,
  events: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotCalendar: { message: Calendar.Message },
  Picked: { date: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  calendar: Calendar.init({ id: "calendar", date: "2024-05-01" }),
  picked: "",
  events: []
})

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    GotCalendar: ({ message: inner }) => {
      const result = Calendar.update(model.calendar, inner)

      return {
        model: {
          ...model,
          calendar: result.model,
          events: [...model.events, ...result.outMessages.map((out) => out._tag)].slice(-3)
        }
      }
    },
    Picked: ({ date }) => ({ model: { ...model, picked: date } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      dates.Calendar(h, {
        model: model.calendar,
        toParentMessage: (inner) => Message.GotCalendar({ message: inner }),
        today: "2024-05-09",
        highlightToday: true,
        getDayProps: (date) => ({ selected: date === model.picked }),
        onDayClick: (date) => Message.Picked({ date })
      }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [`Picked ${model.picked || "nothing"}; ${model.events.join(", ") || "no events"}`]
      })
    ]
  })
