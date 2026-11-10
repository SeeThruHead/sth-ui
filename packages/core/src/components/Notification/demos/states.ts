import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ closed: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Closed: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ closed: 0 })

export const update = (
  model: Model,
  _message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { closed: model.closed + 1 },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 400,
    mx: "auto",
    w: "100%",
    children: [
      ui.Notification(h, {
        loading: true,
        withBorder: true,
        radius: "xs",
        icon: "!",
        title: "Uploading data",
        onClose: Message.Closed(),
        children: ["Data will be loaded in 3 seconds, you cannot close this yet"]
      }),
      ui.Notification(h, {
        withCloseButton: false,
        color: "grape",
        role: "status",
        children: ["No title and no close button"]
      }),
      ui.Notification(h, { loading: true, color: "teal", withCloseButton: false, children: ["Teal loader"] }),
      ui.Notification(h, { title: "Title only", withCloseButton: false, role: "note" }),
      ui.Text(h, { size: "sm", children: [`Closed ${model.closed} times`] })
    ]
  })
