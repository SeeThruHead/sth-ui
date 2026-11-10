import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "../Popover.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ popover: Popover.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPopover: { message: Popover.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ popover: Popover.open(Popover.init({ id: "arrow", isAnimated: false })).model })

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

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Popover(h, {
    model: model.popover,
    toParentMessage: (message) => Message.GotPopover({ message }),
    width: 200,
    position: "bottom-start",
    withArrow: true,
    arrowPosition: "side",
    target: (bind) => ui.Button(h, { bind, children: ["Target element"] }),
    children: [ui.Text(h, { size: "xs", children: ["Arrow position can be changed for *-start and *-end positions"] })]
  })
