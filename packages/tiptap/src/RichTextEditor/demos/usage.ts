import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TextAlign } from "@tiptap/extension-text-align"
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
  richTextEditorLinkControl,
  richTextEditorToolbar
} from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const content =
  '<h2 style="text-align: center;">Welcome to Mantine rich text editor</h2><p><code>RichTextEditor</code> component focuses on usability and is designed to be as simple as possible to bring a familiar editing experience to regular users. <code>RichTextEditor</code> is based on <a href="https://tiptap.dev/" rel="noopener noreferrer" target="_blank">Tiptap.dev</a> and supports all of its features:</p><ul><li>General text formatting: <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike-through</s></li><li>Headings (h1-h6)</li><li>Sub and super scripts (<sup>&lt;sup /&gt;</sup> and <sub>&lt;sub /&gt;</sub> tags)</li><li>Ordered and bullet lists</li><li>Text align&nbsp;</li><li>And all <a href="https://tiptap.dev/extensions" target="_blank" rel="noopener noreferrer">other extensions</a></li></ul>'

export const editor = Editor.create({
  extensions: [StarterKit, Highlight, Superscript, Subscript, TextAlign.configure({ types: ["heading", "paragraph"] })]
})

export const Model = Schema.Struct({ editor: Editor.Model, html: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotEditor: { message: Editor.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ editor: Editor.init({ id: "usage-editor", content }), html: content })

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
          html: result.outMessages.reduce((html, out) => (out._tag === "ChangedContent" ? out.html : html), model.html)
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotEditor({ message: lifted }))
        )
      }
    }
  })

const group = (names: ReadonlyArray<Parameters<typeof richTextEditorControl>[0]>) =>
  richTextEditorControlsGroup<Message>(names.map((name) => richTextEditorControl<Message>(name)))

export const view = (model: Model, h: HtmlBuilder<Message>, _ui: Ui): Html =>
  tiptap.RichTextEditor(h, {
    editor,
    model: model.editor,
    toParentMessage: (message) => Message.GotEditor({ message }),
    children: [
      richTextEditorToolbar({
        sticky: true,
        stickyOffset: 0,
        children: [
          group(["Bold", "Italic", "Underline", "Strikethrough", "ClearFormatting", "Highlight", "Code"]),
          group(["H1", "H2", "H3", "H4"]),
          group(["Blockquote", "Hr", "BulletList", "OrderedList", "Subscript", "Superscript"]),
          richTextEditorControlsGroup([richTextEditorLinkControl(), richTextEditorControl("Unlink")]),
          group(["AlignLeft", "AlignCenter", "AlignJustify", "AlignRight"]),
          group(["Undo", "Redo"])
        ]
      }),
      richTextEditorContent
    ]
  })
