import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({ copied: Schema.Boolean, generation: Schema.Int })

export type Model = typeof Model.Type

export const init = (): Model => ({ copied: false, generation: 0 })

export const Message = defineMessageUnion({
  Pressed: { value: Schema.String },
  Copied: { generation: Schema.Int },
  Failed: {},
  TimedOut: { generation: Schema.Int }
})

export type Message = typeof Message.Type

class ClipboardDenied extends Schema.TaggedError<ClipboardDenied, { readonly brand: unique symbol }>()(
  "ClipboardDenied",
  {}
) {}

export const WriteClipboard = Command.define("CopyButtonWriteClipboard", {
  args: { value: Schema.String, generation: Schema.Int },
  messages: [Message.Copied, Message.Failed],
  execute: ({ value, generation }) =>
    Effect.tryPromise({ try: () => navigator.clipboard.writeText(value), catch: () => new ClipboardDenied() }).pipe(
      Effect.as(Message.Copied({ generation })),
      Effect.orElseSucceed(() => Message.Failed())
    )
})

export const ResetAfter = Command.define("CopyButtonResetAfter", {
  args: { generation: Schema.Int, timeout: Schema.Finite },
  messages: [Message.TimedOut],
  execute: ({ generation, timeout }) =>
    Effect.sleep(Duration.millis(timeout)).pipe(Effect.as(Message.TimedOut({ generation })))
})

export type CopyButtonContext = { readonly timeout?: number }

export const update = (
  model: Model,
  message: Message,
  context: CopyButtonContext = {}
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Pressed: ({ value }) => {
      const generation = model.generation + 1

      return { model: { ...model, generation }, commands: [WriteClipboard({ value, generation })] }
    },
    Copied: ({ generation }) =>
      generation === model.generation
        ? {
            model: { ...model, copied: true },
            commands: [ResetAfter({ generation, timeout: context.timeout ?? 1000 })]
          }
        : { model, commands: [] },
    Failed: () => ({ model: { ...model, copied: false }, commands: [] }),
    TimedOut: ({ generation }) =>
      generation === model.generation ? { model: { ...model, copied: false }, commands: [] } : { model, commands: [] }
  })
