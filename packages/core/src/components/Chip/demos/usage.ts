import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { awesome: true } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Chip(h, { ...wire(model, "awesome"), children: ["Awesome chip"] })
