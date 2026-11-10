import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menubar from "../Menubar.ts"
import type { MenubarMenu, MenubarOptions } from "../Menubar.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ bar: Menubar.Model, chosen: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotBar: { message: Menubar.Message } })
export type Message = typeof Message.Type

export const menus: ReadonlyArray<MenubarMenu> = [
  {
    label: "File",
    items: [
      { value: "new", label: "New file" },
      { value: "open", label: "Open…" },
      { value: "save", label: "Save" },
      { value: "close", label: "Close", disabled: true }
    ]
  },
  {
    label: "Edit",
    labels: { history: "History", clipboard: "Clipboard" },
    items: [
      { value: "undo", label: "Undo", group: "history" },
      { value: "redo", label: "Redo", group: "history" },
      { value: "cut", label: "Cut", group: "clipboard" },
      { value: "copy", label: "Copy", group: "clipboard" },
      { value: "paste", label: "Paste", group: "clipboard" }
    ]
  },
  {
    label: "View",
    items: [
      { value: "zoom-in", label: "Zoom in" },
      { value: "zoom-out", label: "Zoom out" },
      { value: "full-screen", label: "Full screen" }
    ]
  },
  {
    label: "Help",
    items: [
      { value: "docs", label: "Documentation" },
      { value: "about", label: "About" }
    ]
  }
]

const chosenAfter = (chosen: string, outMessages: ReadonlyArray<Menubar.OutMessage>): string => {
  const last = outMessages.at(-1)
  if (last === undefined) return chosen

  return `${last.menu}:${last.value}`
}

export const barDemo = (id: string, entries: ReadonlyArray<MenubarMenu>, options: MenubarOptions = {}) => {
  const context = Menubar.menubarContext({ ...options, menus: entries })
  const init = (): Model => ({ bar: Menubar.init({ id, count: entries.length }), chosen: "" })
  const update = (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const result = Menubar.update(model.bar, message.message, context)

    return {
      model: {
        bar: result.model,
        chosen: chosenAfter(model.chosen, result.outMessages)
      },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (inner) => Message.GotBar({ message: inner }))
      )
    }
  }
  const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
    ui.Stack(h, {
      gap: "sm",
      children: [
        ui.Menubar(h, {
          ...options,
          model: model.bar,
          toParentMessage: (message) => Message.GotBar({ message }),
          menus: entries
        }),
        ui.Text(h, {
          size: "sm",
          c: "dimmed",
          children: [model.chosen === "" ? "Nothing chosen" : `Chose ${model.chosen}`]
        })
      ]
    })

  return { init, update, view }
}
