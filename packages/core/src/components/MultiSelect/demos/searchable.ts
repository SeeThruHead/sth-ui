import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as MultiSelect from "../MultiSelect.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: MultiSelect.Model, firstValues: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: MultiSelect.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: MultiSelect.init({ id: "libraries-search" }),
  firstValues: []
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = MultiSelect.update(model.first, inner, { values: model.firstValues })

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
  toParentMessage: (message: MultiSelect.Message) => Message.GotFirst({ message })
})

const libraries = ["React", "Angular", "Vue", "Svelte"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.MultiSelect(h, {
    ...first(model),
    label: "Your favorite libraries",
    placeholder: "Pick value",
    w: "100%",
    maw: 340,
    data: libraries,
    searchable: true,
    nothingFoundMessage: "Nothing found..."
  })
