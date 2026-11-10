import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Field from "../field.ts"
import type { FieldContext } from "../field.ts"

export const Model = Schema.Struct({ field: Field.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotField: { message: Field.Message } })
export type Message = typeof Message.Type

const taken = ["mantine", "admin", "root"]

export const context: FieldContext = {
  validateOnBlur: true,
  validate: (value) =>
    Effect.sleep(Duration.millis(300)).pipe(
      Effect.as(typeof value === "string" && taken.includes(value.toLowerCase()) ? "That username is taken" : null)
    )
}

export const init = (): Model => ({ field: Field.init({ initialValue: "" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Field.update(model.field, message.message, context)

  return {
    model: { field: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotField({ message: inner }))
    )
  }
}

const send = (message: Field.Message) => Message.GotField({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 360,
    children: [
      ui.TextInput(h, {
        id: "username",
        label: "Username",
        description: "Leave the field to check it",
        ...Field.textFieldProps(model.field, send),
        ...(model.field.validating ? { rightSection: ui.Loader(h, { size: 16 }) } : {})
      }),
      ui.Text(h, { size: "sm", children: [Field.isDirty(model.field) ? "Changed" : "Unchanged"] })
    ]
  })
