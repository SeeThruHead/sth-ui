import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as DataTable from "../DataTable.ts"
import { makeGames, rowId } from "./games.ts"
import type { Game } from "./games.ts"

const rows = makeGames(30)

const columns: ReadonlyArray<DataTable.DataTableColumn<Game>> = [
  { id: "title", title: "Title", value: (game) => game.title, align: "start" },
  { id: "system", title: "System", value: (game) => game.system, align: "center", width: "25%" },
  { id: "regions", title: "Regions", value: (game) => game.regions, align: "end" }
]

export const Model = Schema.Struct({ table: DataTable.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTable: { message: DataTable.Message } })
export type Message = typeof Message.Type

const context: DataTable.DataTableContext<Game> = { rows, columns, rowId }

export const init = (): Model => ({ table: DataTable.init({ id: "plain", rowHeightPx: 32 }, context) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotTable: ({ message: inner }) => {
      const result = DataTable.update(model.table, inner, context)

      return {
        model: { table: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTable({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 640,
    children: [
      DataTable.dataTable(h, {
        model: model.table,
        toParentMessage: (message) => Message.GotTable({ message }),
        rows,
        columns,
        rowId,
        ariaLabel: "Plain games",
        height: "240px",
        overscan: 2,
        striped: true,
        highlightOnHover: false,
        withSearch: false,
        withSelection: false,
        withColumnPicker: false
      })
    ]
  })
