import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

export const Model = Schema.Struct({ plain: Schema.String, seconds: Schema.String, limited: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { name: Schema.Literals(["plain", "seconds", "limited"]), value: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ plain: "", seconds: "12:30:15", limited: "10:00" })

export const update = (model: Model, message: Message): { readonly model: Model } => ({
  model: { ...model, [message.name]: message.value }
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.TimeInput(h, {
        id: "plain",
        label: "Input label",
        description: "Input description",
        value: model.plain,
        onChange: (value) => Message.Changed({ name: "plain", value })
      }),
      dates.TimeInput(h, {
        id: "seconds",
        label: "With seconds",
        withSeconds: true,
        value: model.seconds,
        onChange: (value) => Message.Changed({ name: "seconds", value })
      }),
      dates.TimeInput(h, {
        id: "limited",
        label: "Between 09:00 and 17:00",
        minTime: "09:00",
        maxTime: "17:00",
        value: model.limited,
        onChange: (value) => Message.Changed({ name: "limited", value })
      }),
      dates.TimeInput(h, { id: "fixed", label: "Read only", value: "08:15", readOnly: true }),
      ui.Text(h, { size: "sm", children: [`${model.plain || "empty"} · ${model.seconds} · ${model.limited}`] })
    ]
  })
