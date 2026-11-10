import * as stylex from "@stylexjs/stylex"
import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import { NotchesIcon } from "@sth-ui/icons/icons/NotchesIcon.ts"
import * as FloatingWindow from "../FloatingWindow.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ window: FloatingWindow.Model, visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotWindow: { message: FloatingWindow.Message },
  Toggled: {},
  Hidden: {}
})
export type Message = typeof Message.Type

const look = stylex.create({
  clipped: { overflow: "hidden" },
  grip: { alignItems: "center", justifyContent: "center", cursor: "nwse-resize" }
})

export const init = (): Model => ({ window: FloatingWindow.init({ id: "resize-window" }), visible: false })

const dimensions = {
  initialWidth: 260,
  maxWidth: 500,
  minWidth: 180,
  initialHeight: 260,
  maxHeight: 400,
  minHeight: 220
}

const rules: FloatingWindow.FloatingWindowRules = { constrainOffset: 40, dimensions }

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
      model: { ...model, visible: !model.visible, window: FloatingWindow.init({ id: "resize-window" }) },
      commands: []
    }),
    Hidden: () => ({ model: { ...model, visible: false }, commands: [] })
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
      ...(model.visible
        ? [
            ui.FloatingWindow(h, {
              model: model.window,
              toParentMessage: (message) => Message.GotWindow({ message }),
              withBorder: true,
              constrainOffset: 40,
              dimensions,
              dragHandleSelector: ".drag-handle",
              excludeDragHandleSelector: "button",
              initialPosition: { top: 60, left: 60 },
              styles: { root: [look.clipped] },
              children: [
                ui.Group(h, {
                  justify: "space-between",
                  px: "md",
                  py: "sm",
                  attributes: { root: { class: "drag-handle" } },
                  children: [
                    ui.Text(h, { fw: 500, fz: "sm", children: ["Resize demo"] }),
                    ui.CloseButton(h, { label: "Close", onClick: Message.Hidden() })
                  ]
                }),
                ui.Text(h, {
                  fz: "sm",
                  px: "md",
                  pb: "sm",
                  children: [
                    "Drag the grip in the bottom-right corner to resize. Use the arrow keys when the handle is focused: Left/Right for width, Up/Down for height."
                  ]
                }),
                ui.FloatingWindowResizeHandle(h, {
                  model: model.window,
                  toParentMessage: (message) => Message.GotWindow({ message }),
                  dimensions,
                  ariaLabel: "Resize floating window",
                  pos: "absolute",
                  right: 0,
                  bottom: 0,
                  w: 20,
                  h: 20,
                  display: "flex",
                  styles: { root: [look.grip] },
                  children: [NotchesIcon(h, { size: 14 })]
                })
              ]
            })
          ]
        : [])
    ]
  )
