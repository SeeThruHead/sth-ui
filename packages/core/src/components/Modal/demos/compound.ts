import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Modal from "../Modal.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ modal: Modal.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotModal: { message: Modal.Message }, PressedOpen: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ modal: Modal.init({ id: "compound", opened: false }) })

const settle = (
  result: Modal.Result
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { modal: result.model },
  commands: result.commands.map((command) => Command.mapMessage(command, (message) => Message.GotModal({ message })))
})

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotModal: ({ message: inner }) => settle(Modal.update(model.modal, inner)),
    PressedOpen: () => settle(Modal.open(model.modal))
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, { variant: "default", onClick: Message.PressedOpen(), children: ["Open modal"] }),
      ui.ModalRoot(h, {
        model: model.modal,
        toParentMessage: (message) => Message.GotModal({ message }),
        children: (modal) => [
          modal.overlay(),
          modal.content([
            modal.header([modal.title(["Modal title"]), modal.closeButton()]),
            modal.body(["Modal content"])
          ])
        ]
      })
    ]
  })
