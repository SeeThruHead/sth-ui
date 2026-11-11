import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Form from "../form.ts"
import type { FormContext } from "../form.ts"
import { checkboxProps, textInputProps } from "../inputs.ts"
import { getPath } from "../paths.ts"
import { schemaResolver } from "../validate.ts"
import { toJson } from "@sth-ui/core/json.ts"

const Employee = Schema.Struct({
  name: Schema.String.check(Schema.isNonEmpty({ message: "Name is required" })),
  active: Schema.Boolean
})

const Team = Schema.Struct({
  employees: Schema.Array(Employee).check(Schema.isMinLength(1, { message: "Add at least one employee" }))
})

export const Model = Schema.Struct({ form: Form.Model, saved: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotForm: { message: Form.Message } })
export type Message = typeof Message.Type

export const context: FormContext = { validate: schemaResolver(Team) }

export const init = (): Model => ({
  form: Form.init({
    name: "team",
    initialValues: {
      employees: [
        { name: "Ada", active: true },
        { name: "Linus", active: false }
      ]
    }
  }),
  saved: "Nothing saved"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Form.update(model.form, message.message, context)
  const saved = result.outMessages.flatMap((out) => {
    if (out._tag === "SubmitSucceeded") return [`Saved ${toJson(out.values)}`]

    return out._tag === "SubmitFailed" ? [Object.values(out.errors).join(", ")] : []
  })

  return {
    model: { form: result.model, saved: saved[0] ?? model.saved },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotForm({ message: inner }))
    )
  }
}

const send = (message: Form.Message) => Message.GotForm({ message })

const employees = (model: Model): ReadonlyArray<unknown> => {
  const list = getPath("employees", Form.getValues(model.form))

  return Array.isArray(list) ? list : []
}

const row = (model: Model, h: HtmlBuilder<Message>, ui: Ui) => (_: unknown, index: number) =>
  ui.Group(h, {
    align: "flex-end",
    children: [
      ui.TextInput(h, {
        id: `employee-${index}`,
        label: `Employee ${index + 1}`,
        flex: 1,
        ...textInputProps(model.form, `employees.${index}.name`, send)
      }),
      ui.Switch(h, {
        id: `employee-active-${index}`,
        label: "Active",
        ...checkboxProps(model.form, `employees.${index}.active`, send)
      }),
      ui.Button(h, {
        variant: "default",
        disabled: index === 0,
        onClick: send(Form.reorderListItem("employees", { from: index, to: index - 1 })),
        children: [`Move ${index + 1} up`]
      }),
      ui.Button(h, {
        variant: "subtle",
        color: "red",
        onClick: send(Form.removeListItem("employees", index)),
        children: [`Remove ${index + 1}`]
      })
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const list = employees(model)

  return ui.Stack(h, {
    maw: 640,
    children: [
      ...list.map(row(model, h, ui)),
      ...(model.form.errors["employees"] === undefined
        ? []
        : [ui.Text(h, { c: "red", size: "sm", children: [String(model.form.errors["employees"])] })]),
      ui.Group(h, {
        children: [
          ui.Button(h, {
            variant: "light",
            onClick: send(Form.insertListItem("employees", { name: "", active: false })),
            children: ["Add employee"]
          }),
          ui.Button(h, { onClick: send(Form.submit()), children: ["Save team"] })
        ]
      }),
      ui.Text(h, { size: "sm", children: [model.saved] })
    ]
  })
}
