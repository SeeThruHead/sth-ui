import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Ignored: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({})

export const update = (model: Model, _message: Message) => ({ model })

const fixed = (key: string) => ({ id: key, onChange: () => Message.Ignored() })

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Checkbox(h, { ...fixed("default"), label: "Default checkbox" }),
      ui.Checkbox(h, { ...fixed("indeterminate"), indeterminate: true, label: "Indeterminate checkbox" }),
      ui.Checkbox(h, { ...fixed("checked"), checked: true, label: "Checked checkbox" }),
      ui.Checkbox(h, { ...fixed("outline"), checked: true, variant: "outline", label: "Outline checked checkbox" }),
      ui.Checkbox(h, {
        ...fixed("outline-indeterminate"),
        variant: "outline",
        indeterminate: true,
        label: "Outline indeterminate checkbox"
      }),
      ui.Checkbox(h, { ...fixed("disabled"), disabled: true, label: "Disabled checkbox" }),
      ui.Checkbox(h, {
        ...fixed("disabled-checked"),
        disabled: true,
        checked: true,
        label: "Disabled checked checkbox"
      }),
      ui.Checkbox(h, {
        ...fixed("disabled-indeterminate"),
        disabled: true,
        indeterminate: true,
        label: "Disabled indeterminate checkbox"
      })
    ]
  })
