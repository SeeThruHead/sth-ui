import { TableKit } from "@tiptap/extension-table"
import { StarterKit } from "@tiptap/starter-kit"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Editor from "../model.ts"
import {
  richTextEditorContent,
  richTextEditorControl,
  richTextEditorControlsGroup,
  richTextEditorTableInsertControl,
  richTextEditorToolbar
} from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const editor = Editor.create({ extensions: [StarterKit, TableKit] })

export const Model = Schema.Struct({ editor: Editor.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotEditor: { message: Editor.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  editor: Editor.init({ id: "tables-editor", content: "<p>Insert a table below</p>" })
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotEditor: ({ message: inner }) => {
      const result = Editor.update(model.editor, inner)

      return {
        model: { editor: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotEditor({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, _ui: Ui): Html =>
  tiptap.RichTextEditor(h, {
    editor,
    model: model.editor,
    toParentMessage: (message) => Message.GotEditor({ message }),
    children: [
      richTextEditorToolbar({
        children: [
          richTextEditorControlsGroup([
            richTextEditorTableInsertControl({ maxColumns: 6, maxRows: 5 }),
            richTextEditorControl("TableDelete")
          ]),
          richTextEditorControlsGroup([
            richTextEditorControl("TableColumnBefore"),
            richTextEditorControl("TableColumnAfter"),
            richTextEditorControl("TableColumnDelete")
          ]),
          richTextEditorControlsGroup([
            richTextEditorControl("TableRowBefore"),
            richTextEditorControl("TableRowAfter"),
            richTextEditorControl("TableRowDelete")
          ]),
          richTextEditorControlsGroup([
            richTextEditorControl("TableToggleHeaderRow"),
            richTextEditorControl("TableToggleHeaderColumn"),
            richTextEditorControl("TableMergeCells"),
            richTextEditorControl("TableSplitCell")
          ])
        ]
      }),
      richTextEditorContent
    ]
  })
