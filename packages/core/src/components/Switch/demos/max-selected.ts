import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { value: Schema.Array(Schema.String) } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: ["react"] })

export const update = (model: Model, message: Message) =>
  Message.match(message, { Changed: ({ value }) => ({ model: { ...model, value } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SwitchGroup(h, {
    id: "switch-frameworks-max",
    value: model.value,
    onChange: (value) => Message.Changed({ value }),
    maxSelectedValues: 2,
    children: (switchControl) => [
      ui.Group(h, {
        mt: "xs",
        children: [
          switchControl("react", { label: "React" }),
          switchControl("svelte", { label: "Svelte" }),
          switchControl("ng", { label: "Angular" }),
          switchControl("vue", { label: "Vue" })
        ]
      })
    ]
  })
