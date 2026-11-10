import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as PillsInput from "../PillsInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ input: PillsInput.Model, text: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotInput: { message: PillsInput.Message }, Typed: { text: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ input: PillsInput.init({ id: "tags" }), text: "" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotInput: ({ message: inner }) => {
      const result = PillsInput.update(model.input, inner)

      return {
        model: { ...model, input: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotInput({ message: lifted }))
        )
      }
    },
    Typed: ({ text }) => ({ model: { ...model, text }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.PillsInput(h, {
    model: model.input,
    toParentMessage: (message) => Message.GotInput({ message }),
    label: "PillsInput",
    w: "100%",
    maw: 340,
    pills: ["React", "Vue", "Svelte"].map((name) => ui.Pill(h, { children: [name] })),
    field: { placeholder: "Enter tags", value: model.text, onInput: (text) => Message.Typed({ text }) }
  })
