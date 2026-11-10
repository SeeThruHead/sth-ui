import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { pageLeave } from "../../browser.ts"

export const Model = Schema.Struct({ leaves: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Left: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ leaves: 0 })

export const update = (model: Model, message: Message) =>
  Message.match(message, { Left: () => ({ model: { leaves: model.leaves + 1 } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => pageLeave.pipe(Stream.map(() => Message.Left()))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Text(h, { ta: "center", children: [`Mouse left the page ${model.leaves} times`] })
