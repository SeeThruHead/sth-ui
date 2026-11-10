import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ shown: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Closed: {}, Restored: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ shown: true })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Closed: () => ({ model: { shown: false }, commands: [] }),
    Restored: () => ({ model: { shown: true }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 560,
    children: model.shown
      ? [
          ui.Alert(h, {
            id: "close-alert",
            variant: "filled",
            color: "red",
            radius: "xl",
            title: "Bummer!",
            withCloseButton: true,
            closeButtonLabel: "Dismiss",
            onClose: Message.Closed(),
            children: ["Something terrible happened! You made a mistake and there is no going back."]
          })
        ]
      : [ui.Button(h, { variant: "default", onClick: Message.Restored(), children: ["Show the alert again"] })]
  })
