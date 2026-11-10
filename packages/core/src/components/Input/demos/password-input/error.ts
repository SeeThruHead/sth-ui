import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../../Ui.ts"

export const Model = Schema.Struct({ visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledVisibility: { visible: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledVisibility: ({ visible }) => ({ model: { ...model, visible } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.PasswordInput(h, {
        id: "boolean-error",
        label: "Boolean error",
        placeholder: "Boolean error",
        error: true,
        visible: model.visible,
        onVisibilityChange: (visible) => Message.ToggledVisibility({ visible })
      }),
      ui.PasswordInput(h, {
        id: "message-error",
        mt: "md",
        label: "With error message",
        placeholder: "With error message",
        error: "Invalid name",
        visible: model.visible,
        onVisibilityChange: (visible) => Message.ToggledVisibility({ visible })
      })
    ]
  })
