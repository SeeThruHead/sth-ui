import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import { cardContent, cardStyles } from "./cards.ts"

export const Model = Schema.Struct({ checked: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: false })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { checked: message.checked },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.CheckboxCard(h, {
        checked: model.checked,
        onChange: (checked) => Message.Toggled({ checked }),
        styles: cardStyles(model.checked),
        children: cardContent(h, ui, "mantine/core", "Core components library: inputs, buttons, overlays, etc.")
      })
    ]
  })
