import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

export const Model = Schema.Struct({ picked: Schema.String, hovered: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Picked: { date: Schema.String }, Hovered: { date: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ picked: "2024-05-14", hovered: "" })

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Picked: ({ date }) => ({ model: { ...model, picked: date } }),
    Hovered: ({ date }) => ({ model: { ...model, hovered: date } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      dates.Month(h, {
        month: "2024-05-01",
        today: "2024-05-09",
        highlightToday: true,
        withWeekNumbers: true,
        getDayProps: (date) => ({ selected: date === model.picked }),
        onDayClick: (date) => Message.Picked({ date }),
        onDayMouseEnter: (date) => Message.Hovered({ date })
      }),
      ui.Text(h, {
        size: "sm",
        children: [`Picked ${model.picked}${model.hovered === "" ? "" : `, hovering ${model.hovered}`}`]
      })
    ]
  })
