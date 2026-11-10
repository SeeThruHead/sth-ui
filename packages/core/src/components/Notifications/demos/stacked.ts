import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Notifications from "../model.ts"
import type { NotificationsContext } from "../model.ts"

export const Model = Schema.Struct({ notifications: Notifications.Model, count: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotNotifications: { message: Notifications.Message }, Added: {} })
export type Message = typeof Message.Type

export const context: NotificationsContext = {
  position: "bottom-left",
  autoClose: false,
  pauseResetOnHover: "notification"
}

export const init = (): Model => ({ notifications: Notifications.init({ id: "stacked" }), count: 0 })

const lift = (commands: ReadonlyArray<Command.Command<Notifications.Message>>) =>
  commands.map((command) => Command.mapMessage(command, (inner) => Message.GotNotifications({ message: inner })))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotNotifications: ({ message: inner }) => {
      const result = Notifications.update(model.notifications, inner, context)

      return { model: { ...model, notifications: result.model }, commands: lift(result.commands) }
    },
    Added: () => {
      const count = model.count + 1
      const result = Notifications.update(
        model.notifications,
        Notifications.show({
          title: `Message ${count}`,
          message: `Stacked notification number ${count}`,
          withBorder: true,
          radius: "md"
        }),
        context
      )

      return { model: { notifications: result.model, count }, commands: lift(result.commands) }
    }
  })

const send = (message: Notifications.Message) => Message.GotNotifications({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { onClick: Message.Added(), children: ["Add to stack"] }),
          ui.Button(h, {
            variant: "light",
            onClick: send(
              Notifications.show({
                id: "custom",
                position: "top-center",
                message: "Rendered by renderNotification",
                autoClose: 3000
              })
            ),
            children: ["Show custom"]
          })
        ]
      }),
      ui.Notifications(h, {
        ...context,
        model: model.notifications,
        toParentMessage: send,
        layout: "stacked",
        withinPortal: false,
        zIndex: 300,
        containerWidth: "22.5rem",
        notificationMaxHeight: 160,
        allowScrollDismiss: false,
        renderNotification: (hh, entry, close) =>
          entry.id === "custom"
            ? ui.Paper(hh, {
                p: "md",
                shadow: "md",
                withBorder: true,
                children: [
                  ui.Group(hh, {
                    children: [entry.message, ui.Button(hh, { size: "xs", onClick: close, children: ["Dismiss"] })]
                  })
                ]
              })
            : ui.Notification(hh, { title: entry.title ?? "", onClose: close, children: [entry.message] })
      })
    ]
  })
