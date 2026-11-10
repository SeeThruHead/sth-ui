import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { value: Schema.Array(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: ["email"] })

export const update = (model: Model, message: Message) =>
  Message.match(message, { Changed: ({ value }) => ({ model: { ...model, value } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.CheckboxGroup(h, {
        id: "channels",
        size: "md",
        name: "channels",
        error: "Pick at least two",
        value: model.value,
        onChange: (value) => Message.Changed({ value }),
        children: (checkbox) => [checkbox("email", { label: "Email" }), checkbox("sms", { label: "SMS" })]
      }),
      ui.CheckboxGroup(h, {
        id: "locked",
        label: "Locked",
        readOnly: true,
        value: model.value,
        onChange: (value) => Message.Changed({ value }),
        children: (checkbox) => [checkbox("email", { label: "Email updates" })]
      })
    ]
  })
