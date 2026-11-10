import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Clicked: { value: Schema.String }, Chose: { value: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: "first" })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Clicked: ({ value }) => ({ model: { value: model.value === value ? null : value } }),
    Chose: ({ value }) => ({ model: { value } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.ChipGroup(h, {
    value: model.value,
    onChange: (value) => Message.Chose({ value }),
    children: (chip) => [
      ui.Group(h, {
        children: [
          chip("first", { onClick: Message.Clicked({ value: "first" }), children: ["First"] }),
          chip("second", { onClick: Message.Clicked({ value: "second" }), children: ["Second"] }),
          chip("third", { onClick: Message.Clicked({ value: "third" }), children: ["Third"] })
        ]
      })
    ]
  })
