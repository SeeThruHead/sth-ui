import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as TagsInput from "../TagsInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: TagsInput.Model, firstValues: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: TagsInput.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: TagsInput.init({ id: "tags-clear" }),
  firstValues: ["React"]
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = TagsInput.update(model.first, inner, { values: model.firstValues })

      return {
        model: {
          ...model,
          first: result.model,
          firstValues: result.outMessage === undefined ? model.firstValues : result.outMessage.values
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValues,
  toParentMessage: (message: TagsInput.Message) => Message.GotFirst({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TagsInput(h, {
    ...first(model),
    label: "Press Enter to submit a tag",
    w: "100%",
    maw: 340,
    placeholder: "Enter tag",
    clearable: true
  })
