import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

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
  code: `dates.TimeInput(h, {
{{props}}  id: "plain",
  value: model.plain,
  onChange: (value) => Message.Changed({ name: "plain", value })
})`
})

export const Model = Schema.Struct({ plain: Schema.String, seconds: Schema.String, limited: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { name: Schema.Literals(["plain", "seconds", "limited"]), value: Schema.String }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ plain: "", seconds: "12:30:15", limited: "10:00" })

export const update = (model: Model, message: Message): { readonly model: Model } => ({
  model: { ...model, [message.name]: message.value }
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Box(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.TimeInput(h, {
        id: "plain",
        value: model.plain,
        onChange: (value) => Message.Changed({ name: "plain", value }),
        ...props
      })
    ]
  })
