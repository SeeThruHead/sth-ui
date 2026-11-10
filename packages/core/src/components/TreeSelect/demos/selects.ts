import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as TreeSelect from "../TreeSelect.ts"
import type { InitConfig, TreeSelectContext, TreeSelectProps } from "../TreeSelect.ts"

const Entry = Schema.Struct({
  select: TreeSelect.Model,
  values: Schema.Array(Schema.String),
  events: Schema.Array(Schema.String)
})

export const Model = Schema.Struct({ selects: Schema.Array(Entry) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { index: Schema.Int, message: TreeSelect.Message } })
export type Message = typeof Message.Type

export type SelectSetup = Omit<InitConfig, "id" | "data" | "value"> &
  Omit<TreeSelectContext, "data" | "value"> & {
    readonly id: string
    readonly value?: ReadonlyArray<string>
  }

const eventOf = (out: TreeSelect.OutMessage) =>
  TreeSelect.OutMessage.match(out, {
    Changed: ({ values }) => `Changed ${values.join(", ")}`,
    Removed: ({ value }) => `Removed ${value}`,
    ExpandedChanged: ({ values }) => `Expanded ${values.join(", ")}`,
    DropdownOpened: () => "Opened",
    DropdownClosed: () => "Closed",
    Cleared: () => "Cleared"
  })

export const selectsDemo = (data: TreeSelectProps<never>["data"], setups: ReadonlyArray<SelectSetup>) => {
  const contextOf = (index: number, values: ReadonlyArray<string>): TreeSelectContext => ({
    ...setups[index],
    data,
    value: values
  })

  return {
    init: (): Model => ({
      selects: setups.map((setup) => ({
        select: TreeSelect.init({ ...setup, data, value: setup.value ?? [] }),
        values: setup.value ?? [],
        events: []
      }))
    }),
    update: (
      model: Model,
      message: Message
    ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
      const entry = model.selects[message.index]
      if (entry === undefined) return { model, commands: [] }
      const result = TreeSelect.update(entry.select, message.message, contextOf(message.index, entry.values))
      const values = result.outMessages.reduce(
        (kept, out) => (out._tag === "Changed" ? out.values : kept),
        entry.values
      )
      const next = { select: result.model, values, events: [...entry.events, ...result.outMessages.map(eventOf)] }

      return {
        model: { selects: model.selects.map((kept, index) => (index === message.index ? next : kept)) },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.Got({ index: message.index, message: lifted }))
        )
      }
    },
    select: (model: Model, index: number) => {
      const entry = model.selects[index]
      const setup = setups[index]

      return {
        model: entry?.select ?? TreeSelect.init({ id: "missing", data }),
        data,
        value: entry?.values ?? [],
        toParentMessage: (message: TreeSelect.Message) => Message.Got({ index, message }),
        ...(setup === undefined ? {} : TreeSelect.contextProps(setup))
      }
    },
    events: (model: Model, index: number) => model.selects[index]?.events ?? []
  }
}
