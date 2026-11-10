import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

const Notification = Schema.Struct({ key: Schema.String, label: Schema.String, checked: Schema.Boolean })

export const Model = Schema.Struct({ notifications: Schema.Array(Notification) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ToggledAll: { checked: Schema.Boolean },
  Toggled: { key: Schema.String, checked: Schema.Boolean }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  notifications: [
    { key: "email", label: "Receive email notifications", checked: false },
    { key: "sms", label: "Receive sms notifications", checked: false },
    { key: "push", label: "Receive push notifications", checked: false }
  ]
})

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ToggledAll: ({ checked }) => ({
      model: { notifications: model.notifications.map((notification) => ({ ...notification, checked })) }
    }),
    Toggled: ({ key, checked }) => ({
      model: {
        notifications: model.notifications.map((notification) =>
          notification.key === key ? { ...notification, checked } : notification
        )
      }
    })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const allChecked = model.notifications.every((notification) => notification.checked)
  const someChecked = model.notifications.some((notification) => notification.checked)

  return ui.Box(h, {
    children: [
      ui.Checkbox(h, {
        id: "all",
        checked: allChecked,
        indeterminate: someChecked && !allChecked,
        label: "Receive all notifications",
        onChange: () => Message.ToggledAll({ checked: !allChecked })
      }),
      ...model.notifications.map((notification) =>
        ui.Checkbox(h, {
          id: notification.key,
          mt: "xs",
          ml: 33,
          label: notification.label,
          checked: notification.checked,
          onChange: (checked) => Message.Toggled({ key: notification.key, checked })
        })
      )
    ]
  })
}
