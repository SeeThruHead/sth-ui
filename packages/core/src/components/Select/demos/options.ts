import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Select from "../Select.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: Select.Model,
  firstValue: Schema.NullOr(Schema.String),
  second: Select.Model,
  secondValue: Schema.NullOr(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Select.Message },
  GotSecond: { message: Select.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Select.init({ id: "locked", inputValue: "React" }),
  firstValue: "React",
  second: Select.init({ id: "read", inputValue: "React" }),
  secondValue: "React"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Select.update(model.first, inner)

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
      const result = Select.update(model.second, inner)

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
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Select.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: Select.Message) => Message.GotSecond({ message })
})

const libraries = ["React", "Angular", "Vue", "Svelte"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Select(h, { ...first(model), label: "Locked", data: libraries, clearable: true, disabled: true }),
      ui.Select(h, {
        ...second(model),
        label: "Read only",
        data: libraries,
        clearable: true,
        readOnly: true,
        withCheckIcon: false
      })
    ]
  })
