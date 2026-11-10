import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "labelPosition", options: ["right", "left"], initial: "right", library: "right" },
    { type: "string", prop: "label", initial: "I agree to sell my privacy", library: "" },
    { type: "string", prop: "description", initial: "", library: "" },
    { type: "string", prop: "error", initial: "", library: "" },
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "select", prop: "variant", options: ["filled", "outline", "light"], initial: "filled", library: "filled" },
    { type: "size", prop: "radius", initial: "sm", library: "sm" },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "boolean", prop: "disabled", initial: false, library: false },
    { type: "boolean", prop: "indeterminate", initial: false, library: false }
  ],
  code: `ui.Checkbox(h, {
{{props}}})`
})

export const Model = Schema.Struct({ checked: Schema.Record(Schema.String, Schema.Boolean) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { key: Schema.String, checked: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: { agree: true } })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Toggled: ({ key, checked }) => ({ model: { checked: { ...model.checked, [key]: checked } } })
  })

const wire = (model: Model, key: string) => ({
  id: key,
  checked: model.checked[key] === true,
  onChange: (checked: boolean) => Message.Toggled({ key, checked })
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.Checkbox(h, { ...wire(model, "agree"), ...props })
