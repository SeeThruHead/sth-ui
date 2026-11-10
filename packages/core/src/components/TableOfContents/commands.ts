import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const ScrollMessage = defineMessageUnion({ Scrolled: {} })

export const ScrollTo = Command.define("TableOfContentsScrollTo", {
  args: { selector: Schema.String, index: Schema.Int },
  messages: [ScrollMessage.Scrolled],
  execute: ({ selector, index }) =>
    Effect.sync(() => {
      Option.map(Option.fromNullishOr(document.querySelectorAll(selector).item(index)), (heading) =>
        heading.scrollIntoView()
      )

      return ScrollMessage.Scrolled()
    })
})
