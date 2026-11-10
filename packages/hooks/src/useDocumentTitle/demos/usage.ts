import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { setDocumentTitle } from "../../commands.ts"

export const Model = Schema.Struct({ title: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Typed: { title: Schema.String }, Applied: {}, Ignored: {} })
export type Message = typeof Message.Type

const ignore = () => Message.Ignored()

export const init = (): Model => ({ title: "Inbox (3 unread)" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Typed: ({ title }) => ({ model: { title } }),
    Applied: () => ({ model, commands: [Command.mapMessage(setDocumentTitle({ title: model.title }), ignore)] }),
    Ignored: () => ({ model })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    align: "flex-end",
    children: [
      ui.TextInput(h, {
        id: "document-title",
        label: "Document title",
        value: model.title,
        onInput: (title) => Message.Typed({ title })
      }),
      ui.Button(h, { onClick: Message.Applied(), children: ["Set title"] })
    ]
  })
