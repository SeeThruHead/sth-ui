import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Dialog from "../Dialog.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ dialog: Dialog.Model, email: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotDialog: { message: Dialog.Message },
  Toggled: {},
  Typed: { email: Schema.String },
  Subscribed: {}
})
export type Message = typeof Message.Type

const grow = stylex.create({ root: { flexGrow: 1 } })

export const init = (): Model => ({ dialog: Dialog.init({ id: "newsletter" }), email: "" })

const lift = (model: Model, result: Dialog.Result) => ({
  model: { ...model, dialog: result.model },
  commands: result.commands.map((command) => Command.mapMessage(command, (message) => Message.GotDialog({ message })))
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotDialog: ({ message: inner }) => lift(model, Dialog.update(model.dialog, inner)),
    Toggled: () => lift(model, Dialog.toggle(model.dialog)),
    Typed: ({ email }) => ({ model: { ...model, email }, commands: [] }),
    Subscribed: () => lift({ ...model, email: "" }, Dialog.close(model.dialog))
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Group(h, {
        justify: "center",
        children: [ui.Button(h, { onClick: Message.Toggled(), children: ["Toggle dialog"] })]
      }),
      ui.Dialog(h, {
        model: model.dialog,
        toParentMessage: (message) => Message.GotDialog({ message }),
        withCloseButton: true,
        size: "lg",
        position: { bottom: 20, left: 20 },
        children: [
          ui.Text(h, { size: "sm", mb: "xs", fw: 500, children: ["Subscribe to email newsletter"] }),
          ui.Group(h, {
            align: "flex-end",
            children: [
              ui.TextInput(h, {
                id: "newsletter-email",
                placeholder: "hello@gluesticker.com",
                value: model.email,
                onInput: (email) => Message.Typed({ email }),
                attributes: { input: { "aria-label": "Email" } },
                styles: { root: [grow.root] }
              }),
              ui.Button(h, { onClick: Message.Subscribed(), children: ["Subscribe"] })
            ]
          })
        ]
      })
    ]
  )
