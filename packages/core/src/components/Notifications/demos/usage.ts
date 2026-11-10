import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Notifications from "../model.ts"
import type { NotificationsContext } from "../model.ts"

export const Model = Schema.Struct({ notifications: Notifications.Model, log: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotNotifications: { message: Notifications.Message } })
export type Message = typeof Message.Type

export const context: NotificationsContext = { limit: 3, autoClose: 4000 }

export const init = (): Model => ({ notifications: Notifications.init({ id: "notifications" }), log: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Notifications.update(model.notifications, message.message, context)

  return {
    model: {
      notifications: result.model,
      log: [...model.log, ...result.outMessages.map((out) => `${out._tag} ${out.id}`)].slice(-3)
    },
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
        children: [
          ui.Button(h, {
            onClick: send(
              Notifications.show({
                title: "Default notification",
                message: "Do not forget to star the repo",
                radius: "lg",
                withBorder: true
              })
            ),
            children: ["Show notification"]
          }),
          ui.Button(h, {
            variant: "light",
            onClick: send(
              Notifications.show({
                id: "upload",
                title: "Uploading your data",
                message: "Data will be loaded in 3 seconds",
                loading: true,
                autoClose: false,
                allowClose: false
              })
            ),
            children: ["Start upload"]
          }),
          ui.Button(h, {
            variant: "light",
            color: "teal",
            onClick: send(
              Notifications.updateNotification({
                id: "upload",
                color: "teal",
                title: "Data was loaded",
                message: "The upload is done",
                icon: "check",
                loading: false,
                autoClose: 2000,
                withAutoCloseProgress: false,
                allowClose: true
              })
            ),
            children: ["Finish upload"]
          }),
          ui.Button(h, {
            variant: "default",
            onClick: send(Notifications.show({ message: "Pinned until closed", autoClose: false, priority: 1 })),
            children: ["Show sticky"]
          }),
          ui.Button(h, { variant: "default", onClick: send(Notifications.cleanQueue()), children: ["Clean queue"] }),
          ui.Button(h, {
            variant: "outline",
            color: "red",
            onClick: send(Notifications.clean()),
            children: ["Clean all"]
          })
        ]
      }),
      ui.Text(h, { size: "sm", children: [model.log.join("; ") || "No notifications yet"] }),
      ui.Notifications(h, {
        ...context,
        model: model.notifications,
        toParentMessage: send,
        withAutoCloseProgress: true,
        icons: { check: "✓" }
      })
    ]
  })
