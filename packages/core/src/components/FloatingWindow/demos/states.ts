import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as FloatingWindow from "../FloatingWindow.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ window: FloatingWindow.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotWindow: { message: FloatingWindow.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ window: FloatingWindow.init({ id: "plain-window" }) })

const rules: FloatingWindow.FloatingWindowRules = { constrainToViewport: false }

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotWindow: ({ message: inner }) => {
      const result = FloatingWindow.update(model.window, inner, rules)

      return {
        model: { window: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotWindow({ message: lifted }))
        )
      }
    }
  })

export const subscriptions = Subscription.lift(FloatingWindow.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.window),
  toParentMessage: (message) => Message.GotWindow({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.FloatingWindow(h, {
    model: model.window,
    toParentMessage: (message) => Message.GotWindow({ message }),
    withinPortal: false,
    constrainToViewport: false,
    zIndex: 7,
    w: 220,
    p: "sm",
    attributes: { root: { "aria-label": "Notes" } },
    children: [
      ui.Text(h, { size: "sm", children: ["Notes stay where the page puts them"] }),
      ui.FloatingWindowResizeHandle(h, {
        model: model.window,
        toParentMessage: (message) => Message.GotWindow({ message })
      })
    ]
  })
