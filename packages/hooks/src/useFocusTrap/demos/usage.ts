import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { focusTrapAttributes } from "../focusTrap.ts"

export const Model = Schema.Struct({ active: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Toggled: () => ({ model: { active: !model.active } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 320,
    mx: "auto",
    children: [
      ui.Button(h, {
        onClick: Message.Toggled(),
        children: [model.active ? "Turn off focus trap" : "Turn on focus trap"]
      }),
      h.div(
        [...focusTrapAttributes(h, { active: model.active, returnFocus: true })],
        [
          ui.TextInput(h, { id: "trap-first", label: "First input" }),
          ui.TextInput(h, { id: "trap-second", label: "Second input", mt: "sm" })
        ]
      )
    ]
  })
