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

export const init = (): Model => ({ values: {} })

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
  ui.NumberInput(h, {
    ...wire(model, "field"),
    w: "100%",
    maw: 340,
    label: "Enter value between 10 and 20",
    placeholder: "Don't enter more than 20 and less than 10",
    min: 10,
    max: 20
  })
