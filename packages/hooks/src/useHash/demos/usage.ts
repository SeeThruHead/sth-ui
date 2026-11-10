import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { hash } from "../../browser.ts"
import { setHash } from "../../commands.ts"

export const Model = Schema.Struct({ hash: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { hash: Schema.String },
  Chose: { hash: Schema.String },
  Ignored: {}
})
export type Message = typeof Message.Type

const ignore = () => Message.Ignored()

export const init = (): Model => ({ hash: "" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Changed: (changed) => ({ model: { hash: changed.hash } }),
    Chose: (chosen) => ({ model, commands: [Command.mapMessage(setHash({ hash: chosen.hash }), ignore)] }),
    Ignored: () => ({ model })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => hash.pipe(Stream.map((current) => Message.Changed({ hash: current })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { children: [`Current hash: ${model.hash || "none"}`] }),
      ui.Group(h, {
        children: ["about", "#pricing"].map((target) =>
          ui.Button(h, { variant: "default", onClick: Message.Chose({ hash: target }), children: [`Go to ${target}`] })
        )
      })
    ]
  })
