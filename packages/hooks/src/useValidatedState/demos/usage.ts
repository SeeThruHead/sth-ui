import { Option, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { changeValidated, validated } from "../validated.ts"

const isEmail = (value: string) => /^\S+@\S+$/.test(value)

export const Model = Schema.Struct({
  value: Schema.String,
  lastValidValue: Schema.Option(Schema.String),
  valid: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { value: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => validated("bob@example.com", isEmail)

export const update = (model: Model, message: Message) =>
  Message.match(message, { Changed: ({ value }) => ({ model: changeValidated(model, value, isEmail) }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 360,
    mx: "auto",
    children: [
      ui.TextInput(h, {
        id: "validated-email",
        label: "Your email",
        value: model.value,
        ...(model.valid ? {} : { error: "Enter a valid email" }),
        onInput: (value) => Message.Changed({ value })
      }),
      ui.Text(h, { size: "sm", children: [`Current value: ${model.value || "[empty string]"}`] }),
      ui.Text(h, {
        size: "sm",
        children: [`Last valid value: ${Option.getOrElse(model.lastValidValue, () => "[none]")}`]
      })
    ]
  })
