import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({
  single: Schema.Array(Schema.NullOr(Schema.String)),
  multiple: Schema.Array(Schema.Array(Schema.String))
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedSingle: { index: Schema.Int, value: Schema.NullOr(Schema.String) },
  ChangedMultiple: { index: Schema.Int, values: Schema.Array(Schema.String) }
})
export type Message = typeof Message.Type

const replaced = <A>(list: ReadonlyArray<A>, index: number, next: A) =>
  list.map((kept, at) => (at === index ? next : kept))

export const accordionsDemo = (
  single: ReadonlyArray<string | null>,
  multiple: ReadonlyArray<ReadonlyArray<string>> = []
) => ({
  init: (): Model => ({ single, multiple }),
  update: (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
    Message.match(message, {
      ChangedSingle: ({ index, value }) => ({
        model: { ...model, single: replaced(model.single, index, value) },
        commands: []
      }),
      ChangedMultiple: ({ index, values }) => ({
        model: { ...model, multiple: replaced(model.multiple, index, values) },
        commands: []
      })
    })
})

export const single = (model: Model, index: number) => ({
  value: model.single[index] ?? null,
  onChange: (value: string | null) => Message.ChangedSingle({ index, value })
})

export const multiple = (model: Model, index: number) => ({
  multiple: true as const,
  value: model.multiple[index] ?? [],
  onChange: (values: ReadonlyArray<string>) => Message.ChangedMultiple({ index, values })
})
