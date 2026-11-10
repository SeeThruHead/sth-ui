import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Form from "../form.ts"
import type { FormContext } from "../form.ts"
import { checkboxProps, numberInputProps, textInputProps } from "../inputs.ts"
import { hasLength, isEmail, isInRange, isNotEmpty } from "../validators.ts"

export const Model = Schema.Struct({ form: Form.Model, result: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotForm: { message: Form.Message } })
export type Message = typeof Message.Type

export const context: FormContext = {
  validateInputOnBlur: true,
  validate: {
    name: hasLength({ min: 2 }, "Name must have at least 2 letters"),
    email: isEmail("Invalid email"),
    age: isInRange({ min: 18, max: 99 }, "You must be 18-99 years old to register"),
    terms: isNotEmpty("You must accept the terms")
  }
}

export const init = (): Model => ({
  form: Form.init({ name: "signup", initialValues: { name: "", email: "", age: 18, terms: false } }),
  result: "Not submitted"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Form.update(model.form, message.message, context)
  const outcome = result.outMessages.flatMap((out) => {
    if (out._tag === "SubmitSucceeded") return [`Submitted ${JSON.stringify(out.values)}`]

    return out._tag === "SubmitFailed" ? [`${Object.keys(out.errors).length} fields need attention`] : []
  })

  return {
    model: { form: result.model, result: outcome[0] ?? model.result },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotForm({ message: inner }))
    )
  }
}

const send = (message: Form.Message) => Message.GotForm({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.form(
    [h.OnSubmit(send(Form.submit())), h.Style({ maxWidth: "26rem" })],
    [
      ui.Stack(h, {
        children: [
          ui.TextInput(h, {
            id: "signup-name",
            label: "Name",
            placeholder: "Your name",
            ...textInputProps(model.form, "name", send)
          }),
          ui.TextInput(h, {
            id: "signup-email",
            label: "Email",
            placeholder: "you@example.com",
            ...textInputProps(model.form, "email", send)
          }),
          ui.NumberInput(h, { id: "signup-age", label: "Age", ...numberInputProps(model.form, "age", send) }),
          ui.Checkbox(h, {
            id: "signup-terms",
            label: "I accept the terms and conditions",
            ...checkboxProps(model.form, "terms", send)
          }),
          ui.Group(h, {
            justify: "flex-end",
            children: [
              ui.Button(h, { variant: "default", onClick: send(Form.reset()), children: ["Reset"] }),
              ui.Button(h, { type: "submit", children: ["Submit"] })
            ]
          }),
          ui.Text(h, { size: "sm", children: [model.result] })
        ]
      })
    ]
  )
