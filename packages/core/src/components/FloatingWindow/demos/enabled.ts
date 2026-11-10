import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as FloatingWindow from "../FloatingWindow.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ window: FloatingWindow.Model, visible: Schema.Boolean, enabled: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotWindow: { message: FloatingWindow.Message },
  Toggled: {},
  Hidden: {},
  Switched: { enabled: Schema.Boolean }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  window: FloatingWindow.init({ id: "enabled-window" }),
  visible: false,
  enabled: true
})

const rules: FloatingWindow.FloatingWindowRules = {}

const lift = (command: Command.Command<FloatingWindow.Message>) =>
  Command.mapMessage(command, (message) => Message.GotWindow({ message }))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotWindow: ({ message: inner }) => {
      const result = FloatingWindow.update(model.window, inner, rules)

      return { model: { ...model, window: result.model }, commands: result.commands.map(lift) }
    },
    Toggled: () => ({
      model: { ...model, visible: !model.visible, window: FloatingWindow.init({ id: "enabled-window" }) },
      commands: []
    }),
    Hidden: () => ({ model: { ...model, visible: false }, commands: [] }),
    Switched: ({ enabled }) => ({ model: { ...model, enabled }, commands: [] })
  })

export const subscriptions = Subscription.lift(FloatingWindow.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.window),
  toParentMessage: (message) => Message.GotWindow({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Group(h, {
        children: [
          ui.Button(h, {
            variant: "default",
            onClick: Message.Toggled(),
            children: [`${model.visible ? "Hide" : "Show"} floating window`]
          })
        ]
      }),
      ui.Switch(h, {
        id: "drag-enabled",
        mt: "md",
        label: "Drag enabled",
        checked: model.enabled,
        onChange: (enabled) => Message.Switched({ enabled })
      }),
      ...(model.visible
        ? [
            ui.FloatingWindow(h, {
              model: model.window,
              toParentMessage: (message) => Message.GotWindow({ message }),
              enabled: model.enabled,
              w: 280,
              p: "md",
              withBorder: true,
              excludeDragHandleSelector: "button",
              initialPosition: { top: 110, left: 20 },
              children: [
                ui.Group(h, {
                  justify: "space-between",
                  mb: "md",
                  children: [
                    ui.Text(h, { children: ["Enabled demo"] }),
                    ui.CloseButton(h, { label: "Close", onClick: Message.Hidden() })
                  ]
                }),
                ui.Text(h, { fz: "sm", children: ["Turn dragging off with the switch."] })
              ]
            })
          ]
        : [])
    ]
  )
