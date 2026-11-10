import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as FoldkitFile from "foldkit/file"
import { BrowserMessage, fileDialog } from "../../commands.ts"

export const Model = Schema.Struct({ names: Schema.Array(Schema.String), cancelled: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Opened: {}, Got: { message: BrowserMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ names: [], cancelled: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Opened: () => ({
      model,
      commands: [Command.mapMessage(fileDialog({ accept: "image/*" }), (result) => Message.Got({ message: result }))]
    }),
    Got: ({ message: result }) => ({
      model:
        result._tag === "FilesPicked"
          ? { names: result.files.map(FoldkitFile.name), cancelled: false }
          : { ...model, cancelled: true }
    })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, { onClick: Message.Opened(), children: ["Pick images"] }),
      ui.Text(h, { children: [model.names.length === 0 ? "No files picked" : `Picked: ${model.names.join(", ")}`] }),
      ...(model.cancelled ? [ui.Text(h, { size: "sm", c: "dimmed", children: ["The dialog was closed"] })] : [])
    ]
  })
