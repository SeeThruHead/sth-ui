import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as MultiSelect from "../MultiSelect.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: MultiSelect.Model,
  firstValues: Schema.Array(Schema.String),
  second: MultiSelect.Model,
  secondValues: Schema.Array(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: MultiSelect.Message },
  GotSecond: { message: MultiSelect.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: MultiSelect.init({ id: "filled" }),
  firstValues: ["React", "Vue"],
  second: MultiSelect.init({ id: "locked" }),
  secondValues: ["React", "Ember"]
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
    },
    GotSecond: ({ message: inner }) => {
      const result = MultiSelect.update(model.second, inner, { values: model.secondValues })

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
  toParentMessage: (message: MultiSelect.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValues,
  toParentMessage: (message: MultiSelect.Message) => Message.GotSecond({ message })
})

const libraries = ["React", "Angular", "Vue", "Svelte"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.MultiSelect(h, {
        ...first(model),
        label: "Filled",
        description: "Pills use the contrast variant",
        error: "Too many",
        variant: "filled",
        size: "md",
        name: "frameworks",
        searchable: true,
        data: [
          { value: "React", label: "React", group: "Frontend" },
          { value: "Vue", label: "Vue", group: "Frontend" },
          { value: "Django", label: "Django", group: "Backend", disabled: true }
        ]
      }),
      ui.MultiSelect(h, {
        ...second(model),
        label: "Disabled",
        ariaLabel: "Disabled frameworks",
        disabled: true,
        clearable: true,
        data: libraries
      })
    ]
  })
