import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { reducedMotion } from "../../browser.ts"

export const Model = Schema.Struct({ reduced: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { reduced: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ reduced: false })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Changed: ({ reduced }) => ({ model: { reduced } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => reducedMotion.pipe(Stream.map((reduced) => Message.Changed({ reduced })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Badge(h, {
    color: model.reduced ? "red" : "teal",
    variant: "filled",
    mx: "auto",
    display: "block",
    w: "fit-content",
    children: [model.reduced ? "You prefer reduced motion" : "You do not prefer reduced motion"]
  })
