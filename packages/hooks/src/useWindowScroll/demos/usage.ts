import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { windowScroll } from "../../browser.ts"
import { scrollWindow } from "../../commands.ts"

export const Model = Schema.Struct({ x: Schema.Finite, y: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Scrolled: { x: Schema.Finite, y: Schema.Finite },
  Chose: { y: Schema.Finite },
  Ignored: {}
})
export type Message = typeof Message.Type

const ignore = () => Message.Ignored()

export const init = (): Model => ({ x: 0, y: 0 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Scrolled: (position) => ({ model: { x: position.x, y: position.y } }),
    Chose: ({ y }) => ({ model, commands: [Command.mapMessage(scrollWindow({ y }), ignore)] }),
    Ignored: () => ({ model })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => windowScroll.pipe(Stream.map((position) => Message.Scrolled(position)))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [h.Style({ minHeight: "200vh" })],
    [
      ui.Group(h, {
        justify: "center",
        children: [
          ui.Text(h, { children: [`Scroll position x: ${Math.round(model.x)}, y: ${Math.round(model.y)}`] }),
          ui.Button(h, { onClick: Message.Chose({ y: 200 }), children: ["Scroll down"] }),
          ui.Button(h, { variant: "default", onClick: Message.Chose({ y: 0 }), children: ["Scroll to top"] })
        ]
      })
    ]
  )
