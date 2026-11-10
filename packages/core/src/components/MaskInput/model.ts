import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({
  id: Schema.String,
  raw: Schema.String,
  masked: Schema.String,
  complete: Schema.Boolean,
  generation: Schema.Int
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  raw: "",
  masked: "",
  complete: false,
  generation: 0
})

export const Message = defineMessageUnion({
  Changed: { raw: Schema.String, masked: Schema.String, complete: Schema.Boolean, notify: Schema.Boolean },
  Completed: { raw: Schema.String, masked: Schema.String },
  Reset: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ChangedRaw: { raw: Schema.String, masked: Schema.String },
  Completed: { raw: Schema.String, masked: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    Changed: ({ raw, masked, complete, notify }) => ({
      model: { ...model, raw, masked, complete },
      outMessages: notify ? [OutMessage.ChangedRaw({ raw, masked })] : []
    }),
    Completed: ({ raw, masked }) => ({ model, outMessages: [OutMessage.Completed({ raw, masked })] }),
    Reset: () => ({
      model: { ...model, raw: "", masked: "", complete: false, generation: model.generation + 1 },
      outMessages: [OutMessage.ChangedRaw({ raw: "", masked: "" })]
    })
  })
