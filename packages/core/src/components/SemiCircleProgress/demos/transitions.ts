import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Stepped: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 30 })

export const update = (
  model: Model,
  _message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { value: (model.value + 37) % 101 },
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: 200,
    children: [
      ui.SemiCircleProgress(h, { value: model.value, transitionDuration: 250, label: `${model.value}%` }),
      ui.Button(h, { onClick: Message.Stepped(), mt: "xl", fullWidth: true, children: ["Set next value"] })
    ]
  })
