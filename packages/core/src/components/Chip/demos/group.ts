import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ single: Schema.NullOr(Schema.String), multiple: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChoseOne: { value: Schema.String },
  ChoseMany: { value: Schema.Array(Schema.String) }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ single: null, multiple: [] })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ChoseOne: ({ value }) => ({ model: { ...model, single: value } }),
    ChoseMany: ({ value }) => ({ model: { ...model, multiple: value } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.ChipGroup(h, {
        value: model.single,
        onChange: (value) => Message.ChoseOne({ value }),
        children: (chip) => [
          ui.Group(h, {
            justify: "center",
            children: [
              chip("1", { children: ["Single chip"] }),
              chip("2", { children: ["Can be selected"] }),
              chip("3", { children: ["At a time"] })
            ]
          })
        ]
      }),
      ui.ChipGroup(h, {
        multiple: true,
        value: model.multiple,
        onChange: (value) => Message.ChoseMany({ value }),
        children: (chip) => [
          ui.Group(h, {
            justify: "center",
            mt: "md",
            children: [
              chip("1", { children: ["Multiple chips"] }),
              chip("2", { children: ["Can be selected"] }),
              chip("3", { children: ["At a time"] })
            ]
          })
        ]
      })
    ]
  })
