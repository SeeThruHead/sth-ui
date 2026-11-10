import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const ScrollMessage = defineMessageUnion({ CompletedScroll: {} })

export const ScrollTo = Command.define("DataTableScrollTo", {
  args: { container: Schema.String, top: Schema.Finite },
  messages: [ScrollMessage.CompletedScroll],
  execute: ({ container, top }) =>
    Effect.sync(() => {
      Option.fromNullishOr(document.getElementById(container)).pipe(Option.map((element) => element.scrollTo({ top })))

      return ScrollMessage.CompletedScroll()
    })
})
