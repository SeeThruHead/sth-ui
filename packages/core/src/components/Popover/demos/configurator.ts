import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "../Popover.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "arrowPosition", options: ["center", "side"], initial: "center", library: "center" },
    { type: "number", prop: "arrowOffset", initial: 10, library: 10, min: 5, max: 50 },
    { type: "number", prop: "arrowSize", initial: 7, library: 7, min: 5, max: 12 },
    { type: "number", prop: "arrowRadius", initial: 0, library: 0, min: 0, max: 10 }
  ],
  code: `ui.Popover(h, {
{{props}}  model: model.popover,
  toParentMessage: (message) => Message.GotPopover({ message }),
  width: 200,
  position: "bottom",
  withArrow: true,
  shadow: "md",
  target: (bind) => ui.Button(h, { bind, children: ["Toggle popover"] }),
  children: [
      ui.Text(h, {
        size: "xs",
        children: ["This popover opens when the button is clicked, and closes on Escape or a click outside"]
      })
    ]
})`
})

export const Model = Schema.Struct({ popover: Popover.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPopover: { message: Popover.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ popover: Popover.init({ id: "usage" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => {
      const result = Popover.update(model.popover, inner)

      return {
        model: { popover: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotPopover({ message: lifted }))
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
  ui.Popover(h, {
    model: model.popover,
    toParentMessage: (message) => Message.GotPopover({ message }),
    width: 200,
    position: "bottom",
    withArrow: true,
    shadow: "md",
    target: (bind) => ui.Button(h, { bind, children: ["Toggle popover"] }),
    children: [
      ui.Text(h, {
        size: "xs",
        children: ["This popover opens when the button is clicked, and closes on Escape or a click outside"]
      })
    ],
    ...props
  })
