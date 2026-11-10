import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { orientation } from "../../browser.ts"

export const Model = Schema.Struct({ angle: Schema.Finite, type: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { angle: Schema.Finite, type: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ angle: 0, type: "landscape-primary" })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Changed: ({ angle, type }) => ({ model: { angle, type } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => orientation.pipe(Stream.map((now) => Message.Changed(now)))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    gap: 4,
    children: [ui.Text(h, { children: [`Angle: ${model.angle}`] }), ui.Text(h, { children: [`Type: ${model.type}`] })]
  })
