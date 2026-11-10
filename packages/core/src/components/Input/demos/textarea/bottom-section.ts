import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../../Ui.ts"

const maxLength = 500

export const Model = Schema.Struct({ message: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ChangedMessage: { message: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ message: "" })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ChangedMessage: ({ message: text }) => ({ model: { ...model, message: text.slice(0, maxLength) } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Textarea(h, {
    id: "bottom-section",
    w: "100%",
    maw: 340,
    label: "Your message",
    placeholder: "Type your message...",
    autosize: true,
    minRows: 4,
    value: model.message,
    onInput: (message) => Message.ChangedMessage({ message }),
    bottomSection: ui.Text(h, {
      size: "xs",
      c: "dimmed",
      children: [`${model.message.length}/${maxLength} characters`]
    })
  })
