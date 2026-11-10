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
  ui.CheckboxGroup(h, {
    id: "frameworks",
    value: model.value,
    onChange: (value) => Message.Changed({ value }),
    label: "Select your favorite frameworks/libraries",
    description: "This is anonymous",
    withAsterisk: true,
    children: (checkbox) => [
      ui.Group(h, {
        mt: "xs",
        children: [
          checkbox("react", { label: "React" }),
          checkbox("svelte", { label: "Svelte" }),
          checkbox("ng", { label: "Angular" }),
          checkbox("vue", { label: "Vue" })
        ]
      })
    ]
  })
