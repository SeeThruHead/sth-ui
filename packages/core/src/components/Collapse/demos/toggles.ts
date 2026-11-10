import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({ expanded: Schema.Array(Schema.Boolean), events: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { index: Schema.Int }, Noted: { event: Schema.String } })
export type Message = typeof Message.Type

export const togglesDemo = (count: number) => ({
  init: (): Model => ({ expanded: Array.from({ length: count }, () => false), events: [] }),
  update: (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
    Message.match(message, {
      Toggled: ({ index }) => ({
        model: { ...model, expanded: model.expanded.map((open, at) => (at === index ? !open : open)) },
        commands: []
      }),
      Noted: ({ event }) => ({ model: { ...model, events: [...model.events, event] }, commands: [] })
    })
})

export const isExpanded = (model: Model, index: number) => model.expanded[index] === true
