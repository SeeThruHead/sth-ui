import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const CopyMessage = defineMessageUnion({
  CopyDone: { target: Schema.String, timeout: Schema.Finite },
  CopyFailed: {},
  CopyExpired: { target: Schema.String }
})

class ClipboardUnavailable extends Schema.TaggedError<ClipboardUnavailable, { readonly brand: unique symbol }>()(
  "ClipboardUnavailable",
  {}
) {}

export const CopyText = Command.define("CodeHighlightCopyText", {
  args: { target: Schema.String, text: Schema.String, timeout: Schema.Finite },
  messages: [CopyMessage.CopyDone, CopyMessage.CopyFailed],
  execute: ({ target, text, timeout }) =>
    Effect.tryPromise({
      try: () => navigator.clipboard.writeText(text),
      catch: () => new ClipboardUnavailable({})
    }).pipe(
      Effect.as(CopyMessage.CopyDone({ target, timeout })),
      Effect.orElseSucceed(() => CopyMessage.CopyFailed())
    )
})

export const ExpireCopy = Command.define("CodeHighlightExpireCopy", {
  args: { target: Schema.String, timeout: Schema.Finite },
  messages: [CopyMessage.CopyExpired],
  execute: ({ target, timeout }) =>
    Effect.sleep(Duration.millis(timeout)).pipe(Effect.as(CopyMessage.CopyExpired({ target })))
})
