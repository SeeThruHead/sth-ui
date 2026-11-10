import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import * as FileInput from "../FileInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: FileInput.Model, firstFiles: Schema.Array(Schema.instanceOf(File)) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: FileInput.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: FileInput.init({ id: "both-files" }),
  firstFiles: []
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = FileInput.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstFiles: result.outMessage === undefined ? model.firstFiles : result.outMessage.files
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotFirst({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.FileInput(h, {
    ...first(model),
    clearable: true,
    rightSection: FileTextIcon(h, { size: 18 }),
    label: "Clear and icon",
    placeholder: "Upload files",
    w: "100%",
    maw: 340
  })
