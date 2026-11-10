import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import { LockIcon } from "@sth-ui/icons/icons/LockIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  visible: Schema.Boolean,
  agreed: Schema.Boolean,
  shownPassword: Schema.Boolean,
  shownConfirm: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Toggled: {},
  Agreed: { agreed: Schema.Boolean },
  ShowedPassword: { shown: Schema.Boolean },
  ShowedConfirm: { shown: Schema.Boolean }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false, agreed: true, shownPassword: false, shownConfirm: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Toggled: () => ({ model: { ...model, visible: !model.visible }, commands: [] }),
    Agreed: ({ agreed }) => ({ model: { ...model, agreed }, commands: [] }),
    ShowedPassword: ({ shown }) => ({ model: { ...model, shownPassword: shown }, commands: [] }),
    ShowedConfirm: ({ shown }) => ({ model: { ...model, shownConfirm: shown }, commands: [] })
  })

const authenticationForm = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Paper(h, {
    p: "lg",
    shadow: "sm",
    children: [
      ui.Group(h, {
        grow: true,
        children: [
          ui.TextInput(h, { id: "first-name", required: true, placeholder: "Your first name", label: "First name" }),
          ui.TextInput(h, { id: "last-name", required: true, placeholder: "Your last name", label: "Last name" })
        ]
      }),
      ui.TextInput(h, {
        id: "email",
        mt: "md",
        required: true,
        placeholder: "Your email",
        label: "Email",
        leftSection: AtIcon(h, { size: 16 })
      }),
      ui.PasswordInput(h, {
        id: "password",
        mt: "md",
        required: true,
        placeholder: "Password",
        label: "Password",
        leftSection: LockIcon(h, { size: 16 }),
        visible: model.shownPassword,
        onVisibilityChange: (shown) => Message.ShowedPassword({ shown })
      }),
      ui.PasswordInput(h, {
        id: "confirm-password",
        mt: "md",
        required: true,
        label: "Confirm Password",
        placeholder: "Confirm password",
        leftSection: LockIcon(h, { size: 16 }),
        visible: model.shownConfirm,
        onVisibilityChange: (shown) => Message.ShowedConfirm({ shown })
      }),
      ui.Checkbox(h, {
        id: "terms",
        mt: "xl",
        label: "I agree to sell my soul and privacy to this corporation",
        checked: model.agreed,
        onChange: (agreed) => Message.Agreed({ agreed })
      })
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 400,
    children: [
      ui.Box(h, {
        pos: "relative",
        children: [
          ui.LoadingOverlay(h, { visible: model.visible, zIndex: 1000, overlayProps: { radius: "sm", blur: 2 } }),
          authenticationForm(model, h, ui)
        ]
      }),
      ui.Group(h, {
        justify: "center",
        mt: "xl",
        children: [ui.Button(h, { onClick: Message.Toggled(), children: ["Toggle overlay"] })]
      })
    ]
  })
