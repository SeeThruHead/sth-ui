import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { idle } from "../../browser.ts"

export const Model = Schema.Struct({ idle: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { idle: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ idle: true })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Changed: (changed) => ({ model: { idle: changed.idle } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => idle("2 seconds").pipe(Stream.map((now) => Message.Changed({ idle: now })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Badge(h, {
    color: model.idle ? "blue" : "teal",
    mx: "auto",
    display: "block",
    w: "fit-content",
    children: [`Current state: ${model.idle ? "idle" : "not idle"}`]
  })
