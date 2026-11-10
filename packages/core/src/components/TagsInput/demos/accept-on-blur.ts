import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as TagsInput from "../TagsInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: TagsInput.Model,
  firstValues: Schema.Array(Schema.String),
  second: TagsInput.Model,
  secondValues: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: TagsInput.Message },
  GotSecond: { message: TagsInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: TagsInput.init({ id: "blur-yes" }),
  firstValues: [],
  second: TagsInput.init({ id: "blur-no" }),
  secondValues: []
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
    },
    GotSecond: ({ message: inner }) => {
      const result = TagsInput.update(model.second, inner, { values: model.secondValues, acceptValueOnBlur: false })

      return {
        model: {
          ...model,
          second: result.model,
          secondValues: result.outMessage === undefined ? model.secondValues : result.outMessage.values
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValues,
  toParentMessage: (message: TagsInput.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValues,
  toParentMessage: (message: TagsInput.Message) => Message.GotSecond({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.TagsInput(h, {
        ...first(model),
        label: "Value IS accepted on blur",
        placeholder: "Enter text, then blur the field",
        data: ["React", "Angular", "Svelte"]
      }),
      ui.TagsInput(h, {
        ...second(model),
        label: "Value IS NOT accepted on blur",
        placeholder: "Enter text, then blur the field",
        data: ["React", "Angular", "Svelte"]
      })
    ]
  })
