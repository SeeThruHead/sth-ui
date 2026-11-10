import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as HoverCard from "../HoverCard.ts"
import type { InitConfig } from "../HoverCard.ts"

const Entry = Schema.Struct({ card: HoverCard.Model, opened: Schema.Int, closed: Schema.Int })

export const Model = Schema.Record(Schema.String, Entry)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.String, message: HoverCard.Message } })
export type Message = typeof Message.Type

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const entry = model[message.name]
  if (entry === undefined) return { model, commands: [] }
  const result = HoverCard.update(entry.card, message.message)
  const opened = result.outMessage?._tag === "Opened" ? 1 : 0
  const closed = result.outMessage?._tag === "Closed" ? 1 : 0

  return {
    model: {
      ...model,
      [message.name]: { card: result.model, opened: entry.opened + opened, closed: entry.closed + closed }
    },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.Got({ name: message.name, message: lifted }))
    )
  }
}

export const card = (model: Model, name: string) => ({
  model: model[name]?.card ?? HoverCard.init({ id: name }),
  toParentMessage: (message: HoverCard.Message) => Message.Got({ name, message })
})

export const cardsDemo = (specs: Readonly<Record<string, InitConfig>>) => {
  const init = (): Model =>
    Object.fromEntries(
      Object.entries(specs).map(([name, spec]) => [name, { card: HoverCard.init(spec), opened: 0, closed: 0 }])
    )

  return { init, update, card }
}
