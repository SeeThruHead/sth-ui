import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Menu from "../Menu.ts"
import type { MenuItem } from "../Menu.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ file: Menu.Model, share: Menu.Model, exports: Menu.Model, chosen: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFile: { message: Menu.Message },
  GotShare: { message: Menu.Message },
  GotExports: { message: Menu.Message }
})
export type Message = typeof Message.Type

const closedSubmenus = { share: Menu.init({ id: "share-menu" }), exports: Menu.init({ id: "export-menu" }) }

export const init = (): Model => ({
  file: Menu.init({ id: "file-menu" }),
  ...closedSubmenus,
  chosen: "Nothing chosen yet"
})

const fileItems: ReadonlyArray<MenuItem> = [
  { value: "new", label: "New file" },
  { value: "share", label: "Share", kind: "submenu" },
  { value: "export", label: "Export", kind: "submenu", rightSection: "⌘E" },
  { value: "delete", label: "Delete", color: "red" }
]

const shareItems: ReadonlyArray<MenuItem> = [
  { value: "email", label: "Email" },
  { value: "link", label: "Copy link" }
]

const exportItems: ReadonlyArray<MenuItem> = [
  { value: "pdf", label: "PDF", group: "formats" },
  { value: "png", label: "PNG", group: "formats" }
]

type Lifted = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const commandsOf = (result: Menu.UpdateResult, wrap: (message: Menu.Message) => Message) =>
  (result.commands ?? []).map((command) => Command.mapMessage(command, wrap))

const fromSubmenu = (
  model: Model,
  result: Menu.UpdateResult,
  submenu: Model,
  wrap: (message: Menu.Message) => Message
): Lifted => {
  const chosen = result.outMessage === undefined ? undefined : result.outMessage.value
  const closing = chosen === undefined ? undefined : Menu.close(model.file)

  return {
    model: {
      ...submenu,
      file: closing === undefined ? model.file : closing.model,
      chosen: chosen === undefined ? model.chosen : `Chose ${chosen}`
    },
    commands: [
      ...commandsOf(result, wrap),
      ...(closing === undefined ? [] : commandsOf(closing, (message) => Message.GotFile({ message })))
    ]
  }
}

export const update = (model: Model, message: Message): Lifted =>
  Message.match(message, {
    GotFile: ({ message: inner }) => {
      const result = Menu.update(model.file, inner, { items: fileItems })
      const closed = model.file.isOpen && !result.model.isOpen
      const chosen = result.outMessage === undefined ? model.chosen : `Chose ${result.outMessage.value}`

      return {
        model: { ...model, ...(closed ? closedSubmenus : {}), file: result.model, chosen },
        commands: commandsOf(result, (lifted) => Message.GotFile({ message: lifted }))
      }
    },
    GotShare: ({ message: inner }) => {
      const result = Menu.update(model.share, inner)

      return fromSubmenu(model, result, { ...model, share: result.model }, (lifted) =>
        Message.GotShare({ message: lifted })
      )
    },
    GotExports: ({ message: inner }) => {
      const result = Menu.update(model.exports, inner)

      return fromSubmenu(model, result, { ...model, exports: result.model }, (lifted) =>
        Message.GotExports({ message: lifted })
      )
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Menu(h, {
        model: model.file,
        toParentMessage: (message) => Message.GotFile({ message }),
        width: 200,
        target: (renderRoot) => ui.Button(h, { renderRoot, variant: "default", children: ["File"] }),
        items: fileItems,
        submenus: {
          share: { model: model.share, toParentMessage: (message) => Message.GotShare({ message }), items: shareItems },
          export: {
            model: model.exports,
            toParentMessage: (message) => Message.GotExports({ message }),
            items: exportItems,
            labels: { formats: "Formats" },
            width: 160
          }
        }
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.chosen] })
    ]
  })
