import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { headroom, scrollDirection } from "../../browser.ts"

export const Model = Schema.Struct({ pinned: Schema.Boolean, progress: Schema.Finite, direction: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Moved: { pinned: Schema.Boolean, progress: Schema.Finite },
  Turned: { direction: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ pinned: true, progress: 1, direction: "unknown" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Moved: ({ pinned, progress }) => ({ model: { ...model, pinned, progress } }),
    Turned: ({ direction }) => ({ model: { ...model, direction } })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  headroom: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        headroom({ fixedAt: 120 }).pipe(
          Stream.map(({ pinned, scrollProgress }) => Message.Moved({ pinned, progress: scrollProgress }))
        )
    }
  ),
  direction: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => scrollDirection.pipe(Stream.map((direction) => Message.Turned({ direction })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [h.Style({ minHeight: "300vh" })],
    [
      h.div(
        [
          h.Style({
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            transform: `translateY(${(model.progress - 1) * 100}%)`
          })
        ],
        [
          ui.Paper(h, {
            p: "md",
            shadow: "sm",
            withBorder: true,
            children: [
              ui.Text(h, { children: [`Header ${model.pinned ? "pinned" : "hidden"}, scrolling ${model.direction}`] })
            ]
          })
        ]
      )
    ]
  )
