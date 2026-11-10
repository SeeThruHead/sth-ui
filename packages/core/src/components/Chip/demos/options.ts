import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { xl: true, contrast: true, locked: true } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Chip(h, { ...wire(model, "xl"), size: "xl", radius: "xs", name: "xl", children: ["Extra large"] }),
      ui.Chip(h, { ...wire(model, "contrast"), color: "yellow", autoContrast: true, children: ["Auto contrast"] }),
      ui.Chip(h, {
        ...wire(model, "plain"),
        icon: false,
        variant: "light",
        name: "plain",
        value: "yes",
        children: ["No icon"]
      }),
      ui.Chip(h, { ...wire(model, "locked"), readOnly: true, children: ["Read only"] }),
      ui.Chip(h, { ...wire(model, "single"), type: "radio", variant: "outline", children: ["Single"] })
    ]
  })
