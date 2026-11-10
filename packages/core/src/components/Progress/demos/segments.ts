import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ password: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Typed: { password: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ password: "" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Typed: ({ password }) => ({ model: { password }, commands: [] }) })

const requirements = [/[0-9]/, /[a-z]/, /[A-Z]/, /[$&+,:;=?@#|'<>.^*()%!-]/]

const strengthOf = (password: string) => {
  if (password.length < 5) return 10
  const missing = requirements.filter((requirement) => !requirement.test(password)).length
  const multiplier = (password.length > 5 ? 0 : 1) + missing

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10)
}

const colorOf = (strength: number) => {
  if (strength < 30) return "red"
  if (strength < 50) return "orange"
  if (strength < 70) return "yellow"

  return "teal"
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const strength = strengthOf(model.password)
  const color = colorOf(strength)
  const filled = [model.password.length > 0, strength >= 30, strength >= 50, strength >= 70]

  return h.div(
    [],
    [
      ui.PasswordInput(h, {
        id: "strength-password",
        label: "Enter password",
        placeholder: "Enter password",
        value: model.password,
        onInput: (password) => Message.Typed({ password }),
        w: "100%",
        maw: 340
      }),
      ui.Group(h, {
        grow: true,
        gap: 5,
        mt: "xs",
        maw: 340,
        children: filled.map((on, index) =>
          ui.Progress(h, {
            size: "xs",
            color,
            transitionDuration: 0,
            value: on ? 100 : 0,
            label: `Strength ${index + 1}`
          })
        )
      })
    ]
  )
}
