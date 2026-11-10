import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as JsonInput from "../JsonInput.ts"
import type { JsonInputContext } from "../JsonInput.ts"

const Entry = Schema.Struct({ input: JsonInput.Model, value: Schema.String })

export const Model = Schema.Struct({ inputs: Schema.Array(Entry) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { index: Schema.Int, message: JsonInput.Message } })
export type Message = typeof Message.Type

export type InputSetup = Omit<JsonInputContext, "value"> & { readonly value?: string }

export const inputsDemo = (setups: ReadonlyArray<InputSetup>) => ({
  init: (): Model => ({
    inputs: setups.map((setup) => ({
      input: JsonInput.init({
        value: setup.value ?? "",
        ...(setup.deserialize === undefined ? {} : { deserialize: setup.deserialize })
      }),
      value: setup.value ?? ""
    }))
  }),
  update: (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const entry = model.inputs[message.index]
    if (entry === undefined) return { model, commands: [] }
    const result = JsonInput.update(
      entry.input,
      message.message,
      JsonInput.jsonInputContext({ ...setups[message.index], value: entry.value })
    )
    const next = { input: result.model, value: result.outMessage?.value ?? entry.value }

    return { model: { inputs: model.inputs.map((kept, at) => (at === message.index ? next : kept)) }, commands: [] }
  },
  input: (model: Model, index: number) => ({
    model: model.inputs[index]?.input ?? JsonInput.init(),
    value: model.inputs[index]?.value ?? "",
    toParentMessage: (message: JsonInput.Message) => Message.Got({ index, message }),
    ...JsonInput.contextOptions(setups[index] ?? {})
  })
})
