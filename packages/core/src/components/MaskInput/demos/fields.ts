import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as MaskInput from "../MaskInput.ts"

const Entry = Schema.Struct({ field: MaskInput.Model, completed: Schema.String })

export const Model = Schema.Record(Schema.String, Entry)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { name: Schema.String, message: MaskInput.Message },
  ClickedReset: { name: Schema.String }
})
export type Message = typeof Message.Type

const routed = (model: Model, name: string, message: MaskInput.Message): Model => {
  const entry = model[name]
  if (entry === undefined) return model
  const result = MaskInput.update(entry.field, message)
  const completed = result.outMessages.reduce(
    (latest, out) => (out._tag === "Completed" ? out.masked : latest),
    entry.completed
  )

  return { ...model, [name]: { field: result.model, completed } }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    Got: ({ name, message: inner }) => routed(model, name, inner),
    ClickedReset: ({ name }) => routed(model, name, MaskInput.Message.Reset())
  }),
  commands: []
})

export const field = (model: Model, name: string) => ({
  model: model[name]?.field ?? MaskInput.init({ id: name }),
  toParentMessage: (message: MaskInput.Message) => Message.Got({ name, message })
})

export const fieldsDemo = (names: ReadonlyArray<string>) => ({
  init: (): Model =>
    Object.fromEntries(names.map((name) => [name, { field: MaskInput.init({ id: name }), completed: "" }])),
  update
})

export const entryOf = (model: Model, name: string) =>
  model[name] ?? { field: MaskInput.init({ id: name }), completed: "" }
