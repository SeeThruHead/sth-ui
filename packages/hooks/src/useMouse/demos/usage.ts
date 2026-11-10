import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { mousePosition } from "../../browser.ts"
import { mouse } from "../../mounts.ts"

const Point = Schema.Struct({ x: Schema.Finite, y: Schema.Finite })

export const Model = Schema.Struct({ inside: Point, page: Point })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Moved: { x: Schema.Finite, y: Schema.Finite },
  Paged: { x: Schema.Finite, y: Schema.Finite }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ inside: { x: 0, y: 0 }, page: { x: 0, y: 0 } })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Moved: ({ x, y }) => ({ model: { ...model, inside: { x, y } } }),
    Paged: ({ x, y }) => ({ model: { ...model, page: { x, y } } })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => mousePosition.pipe(Stream.map(({ x, y }) => Message.Paged({ x, y })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.DataAttribute("mouse-target", ""),
          h.Style({ width: "240px", height: "120px", background: "var(--sth-color-gray-1)", borderRadius: "8px" }),
          h.OnMount(Mount.mapMessage(mouse({ resetOnExit: true }), ({ x, y }) => Message.Moved({ x, y })))
        ],
        []
      ),
      ui.Text(h, { children: [`Inside the box: x ${model.inside.x}, y ${model.inside.y}`] }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`On the page: x ${model.page.x}, y ${model.page.y}`] })
    ]
  })
