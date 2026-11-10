import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Finite, presses: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Pressed: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 50, presses: 0 })

const steps = [82, 17, 64, 35, 50]

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Pressed: () => ({
      model: { value: steps[model.presses % steps.length] ?? 50, presses: model.presses + 1 },
      commands: []
    })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Progress(h, { value: model.value, size: "lg", transitionDuration: 200, w: "100%", maw: 520 }),
      ui.Button(h, { mt: "md", onClick: Message.Pressed(), children: ["Set next value"] })
    ]
  )
