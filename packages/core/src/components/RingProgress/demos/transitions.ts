import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Int, presses: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Pressed: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 30, presses: 0 })

const steps = [72, 15, 90, 48, 30]

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Pressed: () => ({
      model: { value: steps[model.presses % steps.length] ?? 30, presses: model.presses + 1 },
      commands: []
    })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.RingProgress(h, {
        sections: [{ value: model.value, color: "blue" }],
        transitionDuration: 250,
        label: ui.Text(h, { ta: "center", children: [`${model.value}%`] })
      }),
      ui.Button(h, { onClick: Message.Pressed(), children: ["Set next value"] })
    ]
  })
