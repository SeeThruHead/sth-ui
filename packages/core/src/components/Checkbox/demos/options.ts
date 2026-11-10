import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { left: true, contrast: true } })

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
      ui.Checkbox(h, {
        ...wire(model, "left"),
        labelPosition: "left",
        size: "xl",
        radius: "md",
        label: "Label on the left",
        description: "Extra large, medium radius",
        name: "left",
        value: "yes"
      }),
      ui.Checkbox(h, { ...wire(model, "contrast"), color: "yellow", autoContrast: true, label: "Auto contrast" }),
      ui.Checkbox(h, { ...wire(model, "locked"), readOnly: true, label: "Read only" }),
      ui.Checkbox(h, { ...wire(model, "row"), attributes: { input: { "aria-label": "Select row" } } })
    ]
  })
