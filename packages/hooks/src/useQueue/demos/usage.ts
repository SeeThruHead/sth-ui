import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { addToQueue, cleanQueue, makeQueue, updateQueue } from "../queue.ts"

const limit = 2

export const Model = Schema.Struct({
  next: Schema.Int,
  state: Schema.Array(Schema.Int),
  queue: Schema.Array(Schema.Int)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Added: {}, Updated: {}, Cleaned: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ next: 4, ...makeQueue(limit, [1, 2, 3]) })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Added: () => ({ model: { ...addToQueue(model, limit, model.next), next: model.next + 1 } }),
    Updated: () => ({
      model: { ...model, ...updateQueue(model, limit, (items) => items.filter((item) => item % 3 !== 0)) }
    }),
    Cleaned: () => ({ model: { ...model, ...cleanQueue(model) } })
  })

const list = (h: HtmlBuilder<Message>, ui: Ui, title: string, items: ReadonlyArray<number>) =>
  ui.Stack(h, {
    gap: 4,
    children: [ui.Text(h, { fw: 500, children: [title] }), ui.Text(h, { children: [items.join(", ") || "Empty"] })]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, { gap: "xl", children: [list(h, ui, "Shown", model.state), list(h, ui, "Waiting", model.queue)] }),
      ui.Group(h, {
        children: [
          ui.Button(h, { onClick: Message.Added(), children: ["Add item"] }),
          ui.Button(h, { variant: "default", onClick: Message.Updated(), children: ["Remove multiples of 3"] }),
          ui.Button(h, { variant: "default", color: "red", onClick: Message.Cleaned(), children: ["Clean queue"] })
        ]
      })
    ]
  })
