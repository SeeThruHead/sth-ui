import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Select from "../Select.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Select.Model, firstValue: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Select.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Select.init({ id: "library-search" }),
  firstValue: null
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
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Select.Message) => Message.GotFirst({ message })
})

const libraries = ["React", "Angular", "Vue", "Svelte"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Select(h, {
    ...first(model),
    label: "Your favorite library",
    placeholder: "Pick value",
    w: "100%",
    maw: 340,
    data: libraries,
    searchable: true,
    nothingFoundMessage: "Nothing found..."
  })
