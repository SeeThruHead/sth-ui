import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { LockSimpleIcon } from "@sth-ui/icons/icons/LockSimpleIcon.ts"
import { LockSimpleOpenIcon } from "@sth-ui/icons/icons/LockSimpleOpenIcon.ts"
import type { ToggleIcon } from "../../PasswordInput.ts"
import type { Ui } from "../../../../Ui.ts"

export const Model = Schema.Struct({ visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledVisibility: { visible: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledVisibility: ({ visible }) => ({ model: { ...model, visible } }) })

const lockIcon: ToggleIcon = (h, reveal, size) =>
  reveal ? LockSimpleOpenIcon(h, { size }) : LockSimpleIcon(h, { size })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.PasswordInput(h, {
    id: "visibility-icon",
    w: "100%",
    maw: 320,
    label: "Change visibility toggle icon",
    placeholder: "Change visibility toggle icon",
    value: "secret",
    visibilityToggleIcon: lockIcon,
    visible: model.visible,
    onVisibilityChange: (visible) => Message.ToggledVisibility({ visible })
  })
