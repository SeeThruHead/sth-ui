import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { NumberInputValue } from "../../NumberInput.ts"
import type { Ui } from "../../../../Ui.ts"

import { defineConfigurator } from "../../../../stories/controls.ts"
import type { Values } from "../../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "label", initial: "Input label", library: "" },
    { type: "boolean", prop: "withAsterisk", initial: false, library: false },
    { type: "string", prop: "description", initial: "Input description", library: "" },
    { type: "string", prop: "error", initial: "", library: "" }
  ],
  code: `ui.NumberInput(h, {
{{props}}  w: "100%",
  maw: 340,
  placeholder: "Input placeholder"
})`
})

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

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.NumberInput(h, { ...wire(model, "field"), w: "100%", maw: 340, placeholder: "Input placeholder", ...props })
