import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details"
import { InvisibleCharacters } from "@tiptap/extension-invisible-characters"
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
  richTextEditorSourceCodeControl,
  richTextEditorToolbar
} from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const editor = Editor.create({
  extensions: [StarterKit, Details, DetailsSummary, DetailsContent, InvisibleCharacters]
})

export const Model = Schema.Struct({ editor: Editor.Model, sourceCode: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotEditor: { message: Editor.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  editor: Editor.init({ id: "extras-editor", content: "<p>Some text to fold away</p>" }),
  sourceCode: false
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotEditor: ({ message: inner }) => {
      const result = Editor.update(model.editor, inner)

      return {
        model: {
          editor: result.model,
          sourceCode: result.outMessages.reduce(
            (active, out) => (out._tag === "SwitchedSourceCode" ? out.active : active),
            model.sourceCode
          )
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotEditor({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      tiptap.RichTextEditor(h, {
        editor,
        model: model.editor,
        toParentMessage: (message) => Message.GotEditor({ message }),
        children: [
          richTextEditorToolbar({
            children: [
              richTextEditorControlsGroup([
                richTextEditorSourceCodeControl(),
                richTextEditorControl("InvisibleCharacters"),
                richTextEditorControl("Details")
              ])
            ]
          }),
          richTextEditorContent
        ]
      }),
      ui.Text(h, { size: "xs", children: [model.sourceCode ? "Source code mode" : "Text mode"] })
    ]
  })
