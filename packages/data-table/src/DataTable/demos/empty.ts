import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as DataTable from "../DataTable.ts"
import { columns, makeGames, rowId } from "./games.ts"
import type { Game } from "./games.ts"

const context: DataTable.DataTableContext<Game> = { rows: makeGames(3), columns, rowId }

export const Model = Schema.Struct({ table: DataTable.Model, imported: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTable: { message: DataTable.Message }, Imported: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ table: DataTable.init({ id: "empty" }, context), imported: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Imported: () => ({ model: { ...model, imported: true }, commands: [] }),
    GotTable: ({ message: inner }) => {
      const result = DataTable.update(model.table, inner, context)

      return {
        model: { ...model, table: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotTable({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 720,
    children: [
      DataTable.dataTable(h, {
        model: model.table,
        toParentMessage: (message) => Message.GotTable({ message }),
        rows: model.imported ? context.rows : [],
        columns,
        rowId,
        ariaLabel: "Imported games",
        toolbar: [ui.Button(h, { variant: "light", onClick: Message.Imported(), children: ["Import games"] })],
        emptyState: "No games imported yet"
      })
    ]
  })
