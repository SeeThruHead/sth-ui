import { Effect, Option, Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"

export const RevealMessage = defineMessageUnion({ Revealed: {} })

export const Reveal = Command.define("SpotlightReveal", {
  args: { id: Schema.String },
  messages: [RevealMessage.Revealed],
  execute: ({ id }) =>
    Effect.sync(() =>
      Option.map(Option.fromNullishOr(document.getElementById(id)), (element) =>
        element.scrollIntoView({ block: "nearest" })
      )
    ).pipe(Effect.as(RevealMessage.Revealed()))
})

const keepFocus = (event: Event) => event.preventDefault()

export const KeepFocus = Mount.defineStream("SpotlightKeepFocus", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => element.addEventListener("mousedown", keepFocus)),
        () => Effect.sync(() => element.removeEventListener("mousedown", keepFocus))
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})
