import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

const outlined = stylex.create({ day: { outlineWidth: "1px", outlineStyle: "dashed", outlineColor: "currentColor" } })

export const Model = Schema.Struct({ date: Schema.String, value: Schema.NullOr(Schema.String), small: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Paged: { date: Schema.String },
  Picked: { date: Schema.String },
  PagedSmall: { date: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ date: "2024-05-06", value: "2024-05-09", small: "2024-12-28" })

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Paged: ({ date }) => ({ model: { ...model, date } }),
    Picked: ({ date }) => ({ model: { ...model, value: date } }),
    PagedSmall: ({ date }) => ({ model: { ...model, small: date } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      dates.MiniCalendar(h, {
        date: model.date,
        value: model.value,
        onDateChange: (date) => Message.Paged({ date }),
        onChange: (date) => Message.Picked({ date }),
        minDate: "2024-05-01",
        maxDate: "2024-05-31"
      }),
      ui.Text(h, { size: "sm", children: [`Selected ${model.value ?? "nothing"}`] }),
      dates.MiniCalendar(h, {
        date: model.small,
        onDateChange: (date) => Message.PagedSmall({ date }),
        numberOfDays: 5,
        size: "xs",
        locale: "fr",
        monthLabelFormat: "MMMM",
        nextLabel: "Suivant",
        previousLabel: "Précédent",
        getDayProps: (date) => (date === "2025-01-01" ? { disabled: true, attributes: { "data-holiday": "" } } : {})
      }),
      dates.MiniCalendar(h, {
        date: "2024-08-05",
        numberOfDays: 3,
        size: "lg",
        formatMonthLabel: (date) => `M${date.slice(5, 7)}`,
        getDayProps: (date) => ({ selected: date === "2024-08-06" }),
        nextIcon: "›",
        previousIcon: "‹",
        styles: { day: outlined.day }
      })
    ]
  })
