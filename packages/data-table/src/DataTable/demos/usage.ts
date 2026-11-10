import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as DataTable from "../DataTable.ts"
import { columns, games, rowId, searchText } from "./games.ts"

export const Model = Schema.Struct({ table: DataTable.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotTable: { message: DataTable.Message },
  Archived: {}
})
export type Message = typeof Message.Type

const context: DataTable.DataTableContext<(typeof games)[number]> = { rows: games, columns, rowId, searchText }

export const init = (): Model => ({
  table: DataTable.init({ id: "games", hidden: ["added"] }, context),
  log: "Nothing yet"
})

const describe = (out: DataTable.OutMessage): string =>
  DataTable.OutMessage.match(out, {
    RowActivated: ({ id }) => `Opened ${id}`,
    SelectionChanged: ({ selected }) => `Selection changed to ${selected.length}`,
    SettingsChanged: ({ settings }) =>
      `Sort ${settings.sort === null ? "none" : `${settings.sort.column} ${settings.sort.direction}`}, hidden ${settings.hidden.join(" ") || "none"}`
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Archived: () => {
      const archived = DataTable.selectedRows(model.table, games, rowId).length
      const shown = DataTable.visibleRows(model.table, games, columns, searchText).length

      return { model: { ...model, log: `Archived ${archived} of ${shown}` }, commands: [] }
    },
    GotTable: ({ message: inner }) => {
      const result = DataTable.update(model.table, inner, context)

      return {
        model: { table: result.model, log: result.outMessages.map(describe).at(-1) ?? model.log },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTable({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 960,
    children: [
      DataTable.dataTable(h, {
        model: model.table,
        toParentMessage: (message) => Message.GotTable({ message }),
        rows: games,
        columns,
        rowId,
        rowLabel: (game) => game.title,
        searchText,
        ariaLabel: "Games",
        height: 420,
        searchPlaceholder: "Search titles",
        bulkActions: () => [ui.Button(h, { size: "compact-sm", onClick: Message.Archived(), children: ["Archive"] })]
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
