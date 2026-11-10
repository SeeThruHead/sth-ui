import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Toggled: () => ({ model: { visible: !model.visible }, commands: [] }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Indicator(h, {
        inline: true,
        disabled: !model.visible,
        color: "red",
        size: 12,
        children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-5.svg", alt: "Avatar 5" })]
      }),
      ui.Button(h, { onClick: Message.Toggled(), children: ["Toggle indicator"] })
    ]
  })
