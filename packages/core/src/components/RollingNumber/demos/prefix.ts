import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ value: Schema.Finite, previous: Schema.Finite, presses: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Added: {}, Removed: {}, Shuffled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 99.99, previous: 99.99, presses: 0 })

const sequence = [4321.5, 7.25, 12000, 999.99]

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
    Added: () => ({ model: next(model, Number((model.value + 10.5).toFixed(2))), commands: [] }),
    Removed: () => ({ model: next(model, Number((model.value - 10.5).toFixed(2))), commands: [] }),
    Shuffled: () => ({ model: next(model, sequence[model.presses % sequence.length] ?? 0, 1), commands: [] })
  })

const shown = (model: Model) => ({ value: model.value, previousValue: model.previous })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.RollingNumber(h, {
        ...shown(model),
        prefix: "$ ",
        suffix: " USD",
        decimalScale: 2,
        fixedDecimalScale: true,
        thousandSeparator: true,
        fz: "32px"
      }),
      ui.Group(h, {
        mt: "md",
        children: [
          ui.Button(h, { onClick: Message.Added(), children: ["+10.50"] }),
          ui.Button(h, { onClick: Message.Removed(), children: ["-10.50"] }),
          ui.Button(h, { onClick: Message.Shuffled(), children: ["Random"] })
        ]
      })
    ]
  )
