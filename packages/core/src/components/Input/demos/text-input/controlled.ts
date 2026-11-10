import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../../Ui.ts"

export const Model = Schema.Struct({ name: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedName: { name: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ name: "" })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ChangedName: ({ name }) => ({ model: { ...model, name } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    gap: "xs",
    children: [
      ui.TextInput(h, {
        id: "name",
        label: "Your name",
        placeholder: "Ana",
        value: model.name,
        onInput: (name) => Message.ChangedName({ name })
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.name === "" ? "Type your name" : `Hello, ${model.name}`] })
    ]
  })
