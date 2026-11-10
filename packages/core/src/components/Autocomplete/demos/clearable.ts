import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Autocomplete from "../Autocomplete.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Autocomplete.Model, firstValue: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Autocomplete.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Autocomplete.init({ id: "clearable", value: "React" }),
  firstValue: "React"
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
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Autocomplete.Message) => Message.GotFirst({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Autocomplete(h, {
    ...first(model),
    w: "100%",
    maw: 340,
    clearable: true,
    data: ["React", "Angular"],
    label: "Clearable autocomplete",
    placeholder: "Clearable autocomplete"
  })
