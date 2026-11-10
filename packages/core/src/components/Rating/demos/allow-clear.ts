import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Rating from "../Rating.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Rating.Model, firstValue: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Rating.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Rating.init({ id: "clearable" }),
  firstValue: 3
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Rating.update(model.first, inner)
      const changed = result.outMessage?._tag === "Changed" ? result.outMessage.value : model.firstValue

      return {
        model: { ...model, first: result.model, firstValue: changed },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Rating.Message) => Message.GotFirst({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "md",
    align: "center",
    children: [
      ui.Text(h, { size: "sm", children: ["Click the same star to clear the rating"] }),
      ui.Rating(h, { ...first(model), allowClear: true }),
      ui.Group(h, {
        gap: "xs",
        children: [
          ui.Text(h, { size: "sm", c: "dimmed", children: ["Current rating:"] }),
          ui.Text(h, {
            size: "sm",
            fw: 600,
            children: [model.firstValue === 0 ? "Not rated" : String(model.firstValue)]
          })
        ]
      })
    ]
  })
