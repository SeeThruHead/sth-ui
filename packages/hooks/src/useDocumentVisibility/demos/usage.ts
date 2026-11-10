import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { documentVisibility } from "../../browser.ts"

export const Model = Schema.Struct({ visibility: Schema.String, changes: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { visibility: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ visibility: "visible", changes: -1 })

export const update = (model: Model, message: Message) =>
  Message.match(message, { Changed: ({ visibility }) => ({ model: { visibility, changes: model.changes + 1 } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => documentVisibility.pipe(Stream.map((visibility) => Message.Changed({ visibility })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Text(h, { ta: "center", children: [`Tab is ${model.visibility}, changed ${Math.max(model.changes, 0)} times`] })
