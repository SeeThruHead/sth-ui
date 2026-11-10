import { Array as Arr, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Tooltip from "../Tooltip.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ tooltips: Schema.Array(Tooltip.Model) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTooltip: { index: Schema.Int, message: Tooltip.Message } })
export type Message = typeof Message.Type

const tooltips = [
  { id: "blue", color: "blue", button: "Blue" },
  { id: "grape", color: "grape", button: "Grape" },
  { id: "teal", color: "teal", button: "Teal" }
] as const

export const init = (): Model => ({
  tooltips: tooltips.map((tooltip) => Tooltip.init({ id: tooltip.id }))
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotTooltip: ({ index, message: inner }) => {
      const results = model.tooltips.map((tooltip, at) =>
        at === index ? Tooltip.update(tooltip, inner) : { model: tooltip, commands: [] }
      )

      return {
        model: { tooltips: results.map((result) => result.model) },
        commands: results.flatMap((result) =>
          (result.commands ?? []).map((command) =>
            Command.mapMessage(command, (lifted) => Message.GotTooltip({ index, message: lifted }))
          )
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    gap: "xl",
    children: Arr.zip(tooltips, model.tooltips).map(([item, tooltip], index) =>
      ui.Tooltip(h, {
        model: tooltip,
        toParentMessage: (message) => Message.GotTooltip({ index, message }),
        label: "Tooltip",
        opened: true,
        color: item.color,
        target: (bind) => ui.Button(h, { bind, children: [item.button] })
      })
    )
  })
