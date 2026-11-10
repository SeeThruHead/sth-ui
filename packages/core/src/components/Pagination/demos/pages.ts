import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Record(Schema.String, Schema.Int)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { name: Schema.String, page: Schema.Int } })
export type Message = typeof Message.Type

export const pagesFrom = (pages: Model) => (): Model => pages

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { ...model, [message.name]: message.page },
  commands: []
})

export const paging = (model: Model, name: string) => ({
  value: model[name] ?? 1,
  onChange: (page: number) => Message.Changed({ name, page })
})
