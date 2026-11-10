import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { checked: true, outline: true, "disabled-checked": true } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Radio(h, { ...wire(model, "default"), label: "Default radio" }),
      ui.Radio(h, { ...wire(model, "checked"), label: "Checked radio" }),
      ui.Radio(h, { ...wire(model, "outline"), variant: "outline", label: "Outline checked radio" }),
      ui.Radio(h, { ...wire(model, "disabled"), disabled: true, label: "Disabled radio" }),
      ui.Radio(h, { ...wire(model, "disabled-checked"), disabled: true, label: "Disabled checked radio" })
    ]
  })
