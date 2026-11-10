import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ArchiveIcon } from "@sth-ui/icons/icons/ArchiveIcon.ts"
import { FolderIcon } from "@sth-ui/icons/icons/FolderIcon.ts"
import { TrashIcon } from "@sth-ui/icons/icons/TrashIcon.ts"
import * as ActionBar from "../ActionBar.ts"
import type { Ui } from "../../../Ui.ts"

const elements = [
  { position: 6, name: "Carbon" },
  { position: 7, name: "Nitrogen" },
  { position: 39, name: "Yttrium" },
  { position: 56, name: "Barium" },
  { position: 58, name: "Cerium" }
] as const

export const Model = Schema.Struct({ bar: ActionBar.Model, selection: Schema.Array(Schema.Int) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Toggled: { position: Schema.Int },
  ToggledAll: {},
  GotBar: { message: ActionBar.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ bar: ActionBar.init({ id: "with-actions" }), selection: [] })

type Update = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const lift = (result: ActionBar.Result, selection: ReadonlyArray<number>): Update => ({
  model: { bar: result.model, selection },
  commands: result.commands.map((command) => Command.mapMessage(command, (message) => Message.GotBar({ message })))
})

const select = (model: Model, selection: ReadonlyArray<number>): Update =>
  lift(ActionBar.setOpened(model.bar, selection.length > 0), selection)

export const update = (model: Model, message: Message): Update =>
  Message.match(message, {
    Toggled: ({ position }) =>
      select(
        model,
        model.selection.includes(position)
          ? model.selection.filter((item) => item !== position)
          : [...model.selection, position]
      ),
    ToggledAll: () =>
      select(model, model.selection.length === elements.length ? [] : elements.map((element) => element.position)),
    GotBar: ({ message: inner }) => {
      const result = ActionBar.update(model.bar, inner)
      const next = lift(result, model.selection)

      return result.outMessages.some((out) => out._tag === "CloseRequested") ? select(next.model, []) : next
    }
  })

const close = Message.GotBar({ message: ActionBar.Message.RequestedClose() })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [
      ui.Checkbox(h, {
        id: "with-actions-all",
        label: "Select all",
        checked: model.selection.length === elements.length,
        indeterminate: model.selection.length > 0 && model.selection.length !== elements.length,
        onChange: () => Message.ToggledAll()
      }),
      ...elements.map((element) =>
        ui.Checkbox(h, {
          id: `with-actions-${element.position}`,
          label: `${element.position}. ${element.name}`,
          checked: model.selection.includes(element.position),
          onChange: () => Message.Toggled({ position: element.position })
        })
      ),
      ui.ActionBar(h, {
        model: model.bar,
        toParentMessage: (message) => Message.GotBar({ message }),
        children: [
          ui.Text(h, { size: "sm", fw: 500, children: [`${model.selection.length} rows selected`] }),
          ui.ActionBarDivider(h),
          ui.Group(h, {
            gap: "xs",
            children: [
              ui.ActionIcon(h, {
                variant: "default",
                color: "red",
                size: "lg",
                label: "Delete",
                children: [TrashIcon(h, { size: 16 })]
              }),
              ui.ActionIcon(h, {
                variant: "default",
                size: "lg",
                label: "Move to folder",
                children: [FolderIcon(h, { size: 16 })]
              }),
              ui.ActionIcon(h, {
                variant: "default",
                size: "lg",
                label: "Archive",
                children: [ArchiveIcon(h, { size: 16 })]
              })
            ]
          }),
          ui.ActionBarDivider(h),
          ui.ActionBarCloseButton(h, { onClose: close })
        ]
      })
    ]
  })
