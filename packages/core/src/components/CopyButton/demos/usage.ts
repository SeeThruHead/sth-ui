import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as CopyButton from "../CopyButton.ts"

export const Model = Schema.Struct({ copy: CopyButton.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotCopy: { message: CopyButton.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ copy: CopyButton.init() })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = CopyButton.update(model.copy, message.message)

  return {
    model: { copy: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotCopy({ message: lifted }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.CopyButton(h, {
    model: model.copy,
    toParentMessage: (message) => Message.GotCopy({ message }),
    value: "https://mantine.dev",
    children: ({ copied, copy }) =>
      ui.Button(h, { color: copied ? "teal" : "blue", onClick: copy, children: [copied ? "Copied url" : "Copy url"] })
  })
