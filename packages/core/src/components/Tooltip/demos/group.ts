import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Tooltip from "../Tooltip.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ tooltips: Schema.Array(Tooltip.Model) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTooltip: { index: Schema.Int, message: Tooltip.Message } })
export type Message = typeof Message.Type

const labels = ["Tooltip 1", "Tooltip 2", "Tooltip 3"]

export const init = (): Model => ({
  tooltips: labels.map((_, index) => Tooltip.init({ id: `group-${index}` }))
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotTooltip: ({ index, message: inner }) => {
      const results = Tooltip.updateGroup(model.tooltips, index, inner, { openDelay: 500, closeDelay: 100 })

      return {
        model: { tooltips: results.map((result) => result.model) },
        commands: results.flatMap((result, at) =>
          result.commands.map((command) =>
            Command.mapMessage(command, (lifted) => Message.GotTooltip({ index: at, message: lifted }))
          )
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: model.tooltips.map((tooltip, index) =>
      ui.Tooltip(h, {
        model: tooltip,
        toParentMessage: (message) => Message.GotTooltip({ index, message }),
        label: labels[index] ?? "",
        target: (bind) => ui.Button(h, { bind, children: [`Button ${index + 1}`] })
      })
    )
  })
