import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Tooltip from "../Tooltip.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "color", prop: "color", initial: "blue" }],
  code: `ui.Tooltip(h, {
{{props}}  model: model.tooltip,
  toParentMessage: (message) => Message.GotTooltip({ message }),
  label: "Tooltip",
  target: (bind) => ui.Button(h, { bind, children: ["Button with tooltip"] })
})`
})

export const Model = Schema.Struct({ tooltip: Tooltip.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTooltip: { message: Tooltip.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ tooltip: Tooltip.init({ id: "usage" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotTooltip: ({ message: inner }) => {
      const result = Tooltip.update(model.tooltip, inner)

      return {
        model: { tooltip: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTooltip({ message: lifted }))
        )
      }
    }
  })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Tooltip(h, {
    model: model.tooltip,
    toParentMessage: (message) => Message.GotTooltip({ message }),
    label: "Tooltip",
    target: (bind) => ui.Button(h, { bind, children: ["Button with tooltip"] }),
    ...props
  })
