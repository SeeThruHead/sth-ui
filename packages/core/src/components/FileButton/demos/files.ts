import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as FileButton from "../FileButton.ts"

export const Model = Schema.Struct({ button: FileButton.Model, files: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotButton: { message: FileButton.Message }, Reset: {} })
export type Message = typeof Message.Type

export const filesDemo = (id: string) => ({
  init: (): Model => ({ button: FileButton.init({ id }), files: [] }),
  update: (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const step = (inner: FileButton.Message) => {
      const result = FileButton.update(model.button, inner)

      return {
        model: {
          button: result.model,
          files: result.outMessage === undefined ? model.files : result.outMessage.files.map((file) => file.name)
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotButton({ message: lifted }))
        )
      }
    }

    return Message.match(message, {
      GotButton: ({ message: inner }) => step(inner),
      Reset: () => step(FileButton.Message.Cleared())
    })
  }
})
