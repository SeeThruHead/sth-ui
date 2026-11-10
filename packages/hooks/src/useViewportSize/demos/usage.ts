import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { viewportSize } from "../../browser.ts"

export const Model = Schema.Struct({ width: Schema.Finite, height: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Resized: { width: Schema.Finite, height: Schema.Finite } })
export type Message = typeof Message.Type

export const init = (): Model => ({ width: 0, height: 0 })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Resized: (size) => ({ model: { width: size.width, height: size.height } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  size: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => viewportSize.pipe(Stream.map((size) => Message.Resized(size)))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Text(h, { ta: "center", children: [`Width: ${model.width}, height: ${model.height}`] })
