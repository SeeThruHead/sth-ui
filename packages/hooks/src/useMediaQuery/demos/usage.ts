import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { mediaQuery } from "../../browser.ts"

export const query = "(min-width: 56.25em)"

export const Model = Schema.Struct({ matches: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Matched: { matches: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ matches: false })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Matched: ({ matches }) => ({ model: { matches } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => mediaQuery(query).pipe(Stream.map((matches) => Message.Matched({ matches })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Badge(h, {
    color: model.matches ? "teal" : "red",
    variant: "filled",
    mx: "auto",
    display: "block",
    w: "fit-content",
    children: [`Breakpoint ${query} ${model.matches ? "matches" : "does not match"}`]
  })
