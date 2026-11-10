import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Drawer from "../Drawer.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ drawer: Drawer.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotDrawer: { message: Drawer.Message }, PressedOpen: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ drawer: Drawer.init({ id: "menu", opened: true }) })

const settle = (
  result: Drawer.Result
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: { drawer: result.model },
  commands: result.commands.map((command) => Command.mapMessage(command, (message) => Message.GotDrawer({ message })))
})

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotDrawer: ({ message: inner }) => settle(Drawer.update(model.drawer, inner)),
    PressedOpen: () => settle(Drawer.open(model.drawer))
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, { variant: "default", onClick: Message.PressedOpen(), children: ["Open Drawer"] }),
      ui.Drawer(h, {
        model: model.drawer,
        toParentMessage: (message) => Message.GotDrawer({ message }),
        title: "Top",
        position: "top",
        size: 200,
        offset: 8,
        radius: "md",
        children: [ui.Text(h, { children: ["Drawer content"] })]
      })
    ]
  })
