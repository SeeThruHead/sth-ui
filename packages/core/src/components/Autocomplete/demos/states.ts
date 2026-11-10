import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Autocomplete from "../Autocomplete.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: Autocomplete.Model,
  firstValue: Schema.String,
  second: Autocomplete.Model,
  secondValue: Schema.String,
  third: Autocomplete.Model,
  thirdValue: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Autocomplete.Message },
  GotSecond: { message: Autocomplete.Message },
  GotThird: { message: Autocomplete.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Autocomplete.init({ id: "read", value: "React" }),
  firstValue: "React",
  second: Autocomplete.init({ id: "locked" }),
  secondValue: "",
  third: Autocomplete.init({ id: "wrong", value: "Rust" }),
  thirdValue: "Rust"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Autocomplete.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    },
    GotSecond: ({ message: inner }) => {
      const result = Autocomplete.update(model.second, inner)

      return {
        model: {
          ...model,
          second: result.model,
          secondValue: result.outMessage === undefined ? model.secondValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    },
    GotThird: ({ message: inner }) => {
      const result = Autocomplete.update(model.third, inner)

      return {
        model: {
          ...model,
          third: result.model,
          thirdValue: result.outMessage === undefined ? model.thirdValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotThird({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Autocomplete.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: Autocomplete.Message) => Message.GotSecond({ message })
})

const third = (model: Model) => ({
  model: model.third,
  value: model.thirdValue,
  toParentMessage: (message: Autocomplete.Message) => Message.GotThird({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Autocomplete(h, { ...first(model), label: "Read only", readOnly: true, clearable: true, data: ["React"] }),
      ui.Autocomplete(h, {
        ...second(model),
        label: "Disabled",
        disabled: true,
        placeholder: "Disabled",
        data: ["React"]
      }),
      ui.Autocomplete(h, {
        ...third(model),
        label: "Error",
        error: "Pick a frontend library",
        nothingFoundMessage: "No such library",
        data: ["React", "Vue"]
      })
    ]
  })
