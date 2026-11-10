import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const ScrollerCommandMessage = defineMessageUnion({ Scrolled: {} })

const containerOf = (id: string): Option.Option<HTMLElement> => Option.fromNullishOr(document.getElementById(id))

const isRtl = (element: Element): boolean => getComputedStyle(element).direction === "rtl"

export const ScrollBy = Command.define("ScrollerScrollBy", {
  args: { id: Schema.String, amount: Schema.Finite },
  messages: [ScrollerCommandMessage.Scrolled],
  execute: ({ id, amount }) =>
    Effect.sync(() => {
      Option.map(containerOf(id), (container) =>
        container.scrollBy({ left: isRtl(container) ? -amount : amount, behavior: "smooth" })
      )

      return ScrollerCommandMessage.Scrolled()
    })
})

export const ScrollTo = Command.define("ScrollerScrollTo", {
  args: { id: Schema.String, left: Schema.Finite },
  messages: [ScrollerCommandMessage.Scrolled],
  execute: ({ id, left }) =>
    Effect.sync(() => {
      Option.map(containerOf(id), (container) => container.scrollTo({ left, behavior: "instant" }))

      return ScrollerCommandMessage.Scrolled()
    })
})
