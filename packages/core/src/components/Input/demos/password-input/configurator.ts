import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
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
  code: `ui.PasswordInput(h, {
{{props}}  id: "usage",
  w: "100%",
  maw: 340,
  placeholder: "Input placeholder",
  visible: model.visible,
  onVisibilityChange: (visible) => Message.ToggledVisibility({ visible })
})`
})

export const Model = Schema.Struct({ visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledVisibility: { visible: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledVisibility: ({ visible }) => ({ model: { ...model, visible } }) })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.PasswordInput(h, {
    id: "usage",
    w: "100%",
    maw: 340,
    placeholder: "Input placeholder",
    visible: model.visible,
    onVisibilityChange: (visible) => Message.ToggledVisibility({ visible }),
    ...props
  })
