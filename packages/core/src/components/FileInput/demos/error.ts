import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as FileInput from "../FileInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: FileInput.Model,
  firstFiles: Schema.Array(Schema.instanceOf(File)),
  second: FileInput.Model,
  secondFiles: Schema.Array(Schema.instanceOf(File))
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: FileInput.Message },
  GotSecond: { message: FileInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: FileInput.init({ id: "boolean-error" }),
  firstFiles: [],
  second: FileInput.init({ id: "message-error" }),
  secondFiles: []
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
    },
    GotSecond: ({ message: inner }) => {
      const result = FileInput.update(model.second, inner)

      return {
        model: {
          ...model,
          second: result.model,
          secondFiles: result.outMessage === undefined ? model.secondFiles : result.outMessage.files
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondFiles,
  toParentMessage: (message: FileInput.Message) => Message.GotSecond({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.FileInput(h, { ...first(model), label: "Boolean error", placeholder: "Boolean error", error: true }),
      ui.FileInput(h, {
        ...second(model),
        label: "With error message",
        placeholder: "With error message",
        error: "Invalid name"
      })
    ]
  })
