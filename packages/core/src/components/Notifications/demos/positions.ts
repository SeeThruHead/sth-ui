import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Notifications from "../model.ts"
import { positions } from "../queue.ts"

export const Model = Schema.Struct({ notifications: Notifications.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotNotifications: { message: Notifications.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ notifications: Notifications.init({ id: "positions" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Notifications.update(model.notifications, message.message)

  return {
    model: { notifications: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotNotifications({ message: inner }))
    )
  }
}

const send = (message: Notifications.Message) => Message.GotNotifications({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Group(h, {
        children: positions.map((position) =>
          ui.Button(h, {
            variant: "default",
            onClick: send(
              Notifications.show({ position, title: `Notification at ${position}`, message: "Shown in this corner" })
            ),
            children: [position]
          })
        )
      }),
      ui.Notifications(h, { model: model.notifications, toParentMessage: send, withAutoCloseProgress: true })
    ]
  })
