import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ active: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledTrap: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: false })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledTrap: () => ({ model: { active: !model.active } }) })

const input = (h: HtmlBuilder<Message>, ui: Ui, label: string) =>
  ui.Box(h, {
    mt: "sm",
    children: [
      h.label([h.Style({ display: "block", fontSize: "14px", fontWeight: "500" })], [label]),
      h.input([h.AriaLabel(label), h.Placeholder(label), h.Style({ width: "100%", boxSizing: "border-box" })])
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    w: "100%",
    children: [
      ui.Button(h, {
        onClick: Message.ToggledTrap(),
        children: [`${model.active ? "Deactivate" : "Activate"} focus trap`]
      }),
      ui.FocusTrap(h, {
        active: model.active,
        children: [h.div([], [input(h, ui, "First input"), input(h, ui, "Second input"), input(h, ui, "Third input")])]
      })
    ]
  })
