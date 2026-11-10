import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import { TextItalicIcon } from "@sth-ui/icons/icons/TextItalicIcon.ts"
import { TextUnderlineIcon } from "@sth-ui/icons/icons/TextUnderlineIcon.ts"
import type { Ui } from "../../../Ui.ts"

const Format = Schema.Literals(["bold", "italic", "underline"])
type Format = typeof Format.Type

export const Model = Schema.Struct({ bold: Schema.Boolean, italic: Schema.Boolean, underline: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: { format: Format, active: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ bold: false, italic: false, underline: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { ...model, [message.format]: message.active },
  commands: []
})

const formats = [
  ["bold", "Bold", TextBIcon],
  ["italic", "Italic", TextItalicIcon],
  ["underline", "Underline", TextUnderlineIcon]
] as const

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: formats.map(([format, label, Icon]) =>
      ui.Toggle(h, {
        ariaLabel: label,
        active: model[format],
        onActiveChange: (active) => Message.Toggled({ format, active }),
        children: [Icon(h, { weight: "bold", size: "100%" })]
      })
    )
  })
