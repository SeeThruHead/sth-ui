import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Finite, previous: Schema.Finite, presses: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Incremented: {}, Decremented: {}, Shuffled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 1234, previous: 1234, presses: 0 })

const sequence = [8406, 51, 9999, 1203, 640]

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
    Incremented: () => ({ model: next(model, model.value + 1), commands: [] }),
    Decremented: () => ({ model: next(model, model.value - 1), commands: [] }),
    Shuffled: () => ({ model: next(model, sequence[model.presses % sequence.length] ?? 0, 1), commands: [] })
  })

const shown = (model: Model) => ({ value: model.value, previousValue: model.previous })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.RollingNumber(h, { ...shown(model), fz: "36px" }),
      ui.Group(h, {
        mt: "md",
        children: [
          ui.Button(h, { onClick: Message.Incremented(), children: ["Increment"] }),
          ui.Button(h, { onClick: Message.Decremented(), children: ["Decrement"] }),
          ui.Button(h, { onClick: Message.Shuffled(), children: ["Random"] })
        ]
      })
    ]
  )
