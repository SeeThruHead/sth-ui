import { Effect, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"

export const RevealThumbnail = Mount.defineStream("LightboxRevealThumbnail", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.sync(() => element.scrollIntoView({ block: "nearest", inline: "center" })).pipe(
        Effect.flatMap(() => Effect.never)
      )
    )
})
