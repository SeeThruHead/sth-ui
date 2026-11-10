import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { light: true, teal: true, grape: true, css: true } })

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
    gap: 7,
    children: [
      ui.Checkbox(h, { ...wire(model, "light"), variant: "light", label: "Light checkbox" }),
      ui.Checkbox(h, {
        ...wire(model, "light-indeterminate"),
        variant: "light",
        indeterminate: true,
        label: "Light indeterminate checkbox"
      }),
      ui.Checkbox(h, { ...wire(model, "teal"), variant: "light", color: "teal", label: "Teal light checkbox" }),
      ui.Checkbox(h, { ...wire(model, "grape"), variant: "light", color: "grape", label: "Grape light checkbox" }),
      ui.Checkbox(h, {
        ...wire(model, "css"),
        variant: "light",
        color: "#e64980",
        label: "Light checkbox with CSS color"
      })
    ]
  })
