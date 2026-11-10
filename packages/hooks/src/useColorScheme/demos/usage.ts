import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { colorScheme } from "../../browser.ts"
import type { ColorScheme } from "../colorScheme.ts"

export const Model = Schema.Struct({ scheme: Schema.Literals(["dark", "light"]) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { scheme: Schema.Literals(["dark", "light"]) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ scheme: "light" })

export const update = (_model: Model, message: Message) =>
  Message.match(message, { Changed: ({ scheme }) => ({ model: { scheme } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => colorScheme.pipe(Stream.map((scheme: ColorScheme) => Message.Changed({ scheme })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Text(h, { ta: "center", children: [`Your system color scheme is ${model.scheme}`] })
