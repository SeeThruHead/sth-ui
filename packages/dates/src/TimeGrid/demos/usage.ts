import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import { timeRange } from "../../time/clock.ts"

const outlined = stylex.create({ grid: { padding: "4px" } })

export const Model = Schema.Struct({ slot: Schema.NullOr(Schema.String), evening: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Slot: { value: Schema.NullOr(Schema.String) },
  Evening: { value: Schema.NullOr(Schema.String) }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ slot: "10:00", evening: null })

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Slot: ({ value }) => ({ model: { ...model, slot: value } }),
    Evening: ({ value }) => ({ model: { ...model, evening: value } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 420,
    mx: "auto",
    children: [
      dates.TimeGrid(h, {
        data: timeRange("10:00", "14:00", "01:00").map((time) => time.slice(0, 5)),
        value: model.slot,
        onChange: (value) => Message.Slot({ value }),
        allowDeselect: true,
        disableTime: ["12:00"],
        getControlProps: (time) => ({ attributes: { "aria-label": `Slot at ${time}` } })
      }),
      ui.Text(h, { size: "sm", children: [`Slot: ${model.slot ?? "none"}`] }),
      dates.TimeGrid(h, {
        data: ["17:00:00", "18:30:00", "20:00:30", "22:00:00"],
        value: model.evening,
        onChange: (value) => Message.Evening({ value }),
        format: "12h",
        amPmLabels: { am: "a.m.", pm: "p.m." },
        withSeconds: true,
        minTime: "18:00",
        maxTime: "21:00",
        disableTime: (time) => time.startsWith("20"),
        size: "lg",
        radius: "xl",
        cols: 2,
        spacing: "md",
        styles: { simpleGrid: outlined.grid }
      }),
      ui.Text(h, { size: "sm", children: [`Evening: ${model.evening ?? "none"}`] }),
      dates.TimeGrid(h, { data: ["09:00", "09:30"], value: "09:00", disabled: true })
    ]
  })
