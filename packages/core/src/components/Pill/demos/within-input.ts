import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ items: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Removed: { item: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ items: Array.from({ length: 10 }, (_, index) => `Item ${index}`) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Removed: ({ item }) => ({ model: { items: model.items.filter((kept) => kept !== item) }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.InputBase(h, {
    id: "chosen-items",
    component: "div",
    multiline: true,
    w: "100%",
    maw: 340,
    attributes: { input: { "aria-label": "Chosen items" } },
    children: [
      ui.PillGroup(h, {
        children: model.items.map((item) =>
          ui.Pill(h, { withRemoveButton: true, onRemove: Message.Removed({ item }), children: [item] })
        )
      })
    ]
  })
