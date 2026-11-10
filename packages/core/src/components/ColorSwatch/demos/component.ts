import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { CheckIcon } from "@sth-ui/icons/icons/CheckIcon.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ checked: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ checked: true })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Toggled: () => ({ model: { checked: !model.checked }, commands: [] }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.ColorSwatch(h, {
    component: "button",
    color: palette.grape6,
    onClick: Message.Toggled(),
    c: "white",
    ariaLabel: model.checked ? "Grape, chosen" : "Grape",
    children: model.checked ? [CheckIcon(h, { size: 12 })] : []
  })
