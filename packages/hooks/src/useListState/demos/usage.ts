import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { append, pop, prepend, remove, reorder, swap } from "../list.ts"

export const Model = Schema.Struct({ items: Schema.Array(Schema.String), next: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Appended: {},
  Prepended: {},
  Popped: {},
  Removed: { index: Schema.Int },
  Reordered: {},
  Swapped: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({ items: ["Apple", "Banana", "Cherry"], next: 1 })

const added = (model: Model) => `Item ${model.next}`

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Appended: () => ({ model: { items: append(model.items, added(model)), next: model.next + 1 } }),
    Prepended: () => ({ model: { items: prepend(model.items, added(model)), next: model.next + 1 } }),
    Popped: () => ({ model: { ...model, items: pop(model.items) } }),
    Removed: ({ index }) => ({ model: { ...model, items: remove(model.items, index) } }),
    Reordered: () => ({ model: { ...model, items: reorder(model.items, { from: 0, to: model.items.length - 1 }) } }),
    Swapped: () => ({ model: { ...model, items: swap(model.items, { from: 0, to: 1 }) } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        gap: "xs",
        children: model.items.map((item, index) =>
          ui.Pill(h, { withRemoveButton: true, onRemove: Message.Removed({ index }), children: [item] })
        )
      }),
      ui.Group(h, {
        gap: "xs",
        justify: "center",
        children: [
          ui.Button(h, { size: "xs", onClick: Message.Appended(), children: ["Append"] }),
          ui.Button(h, { size: "xs", onClick: Message.Prepended(), children: ["Prepend"] }),
          ui.Button(h, { size: "xs", variant: "default", onClick: Message.Popped(), children: ["Pop"] }),
          ui.Button(h, { size: "xs", variant: "default", onClick: Message.Reordered(), children: ["First to last"] }),
          ui.Button(h, { size: "xs", variant: "default", onClick: Message.Swapped(), children: ["Swap first two"] })
        ]
      })
    ]
  })
