import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Finite, previous: Schema.Finite, presses: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Shuffled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 500, previous: 500, presses: 0 })

const sequence = [827, 93, 410, 768]

const next = (model: Model, value: number, shuffled = 0): Model => ({
  value,
  previous: model.value,
  presses: model.presses + shuffled
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Shuffled: () => ({ model: next(model, sequence[model.presses % sequence.length] ?? 0, 1), commands: [] })
  })

const shown = (model: Model) => ({ value: model.value, previousValue: model.previous })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ...[200, 600, 1200].map((duration) =>
        h.div(
          [],
          [
            ui.Text(h, { size: "sm", c: "dimmed", children: [duration === 600 ? "600ms (default)" : `${duration}ms`] }),
            ui.RollingNumber(h, { ...shown(model), animationDuration: duration, fz: "28px" })
          ]
        )
      ),
      ui.Group(h, { children: [ui.Button(h, { onClick: Message.Shuffled(), children: ["Random"] })] })
    ]
  })
