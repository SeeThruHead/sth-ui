import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { NumberInputValue } from "../../NumberInput.ts"
import type { Ui } from "../../../../Ui.ts"

const Value = Schema.Union([Schema.Finite, Schema.String])

export const Model = Schema.Struct({ values: Schema.Record(Schema.String, Value) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { key: Schema.String, value: Value } })
export type Message = typeof Message.Type

export const init = (): Model => ({ values: { comma: 1_000_000, space: 1_000_000 } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Changed: ({ key, value }) => ({ model: { values: { ...model.values, [key]: value } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  value: model.values[key] ?? "",
  onChange: (value: NumberInputValue) => Message.Changed({ key, value })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.NumberInput(h, {
        ...wire(model, "comma"),
        label: "Thousands are separated with a comma",
        placeholder: "Thousands are separated with a comma",
        thousandSeparator: ","
      }),
      ui.NumberInput(h, {
        ...wire(model, "space"),
        label: "Thousands are separated with a space",
        placeholder: "Thousands are separated with a space",
        thousandSeparator: " ",
        mt: "md"
      })
    ]
  })
