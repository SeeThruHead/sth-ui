import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

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
  code: `ui.NativeSelect(h, {
{{props}}  id: "framework",
  value: model.value,
  onChange: (value) => Message.Chose({ value }),
  data: ["React", "Angular", "Vue"]
})`
})

export const Model = Schema.Struct({ value: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Chose: { value: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: "React" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { value: message.value },
  commands: []
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "xs",
    children: [
      ui.NativeSelect(h, {
        id: "framework",
        value: model.value,
        onChange: (value) => Message.Chose({ value }),
        data: ["React", "Angular", "Vue"],
        ...props
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Selected: ${model.value}`] })
    ]
  })
