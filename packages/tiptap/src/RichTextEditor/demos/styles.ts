import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { StarterKit } from "@tiptap/starter-kit"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { common, createLowlight } from "lowlight"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Editor from "../model.ts"
import { richTextEditorContent } from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

const lowlight = createLowlight(common)

const code = [
  '<pre><code class="language-ts">// Greets everyone\nconst greet = (name: string): string => `Hello ${name}`\nexport default greet(42)</code></pre>',
  "<pre><code>SELECT name FROM users WHERE id = 1;</code></pre>"
].join("")

const plain =
  "<h2>No typography styles</h2><p>A paragraph with <code>inline code</code>.</p><ul><li><p>A list</p></li></ul>"

export const highlighted = Editor.create({
  extensions: [StarterKit.configure({ codeBlock: false }), CodeBlockLowlight.configure({ lowlight })]
})

export const unhighlighted = Editor.create({
  extensions: [StarterKit.configure({ codeBlock: false }), CodeBlockLowlight.configure({ lowlight })],
  withCodeHighlightStyles: false
})

export const bare = Editor.create({ extensions: [StarterKit], withTypographyStyles: false })

export const Model = Schema.Struct({ highlighted: Editor.Model, unhighlighted: Editor.Model, bare: Editor.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotHighlighted: { message: Editor.Message },
  GotUnhighlighted: { message: Editor.Message },
  GotBare: { message: Editor.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  highlighted: Editor.init({ id: "highlighted-editor", content: code }),
  unhighlighted: Editor.init({ id: "unhighlighted-editor", content: code }),
  bare: Editor.init({ id: "bare-editor", content: plain })
})

const lift =
  (wrap: (message: Editor.Message) => Message) =>
  (result: Editor.Result): ReadonlyArray<Command.Command<Message>> =>
    result.commands.map((command) => Command.mapMessage(command, wrap))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotHighlighted: ({ message: inner }) => {
      const result = Editor.update(model.highlighted, inner)
      return {
        model: { ...model, highlighted: result.model },
        commands: lift((m) => Message.GotHighlighted({ message: m }))(result)
      }
    },
    GotUnhighlighted: ({ message: inner }) => {
      const result = Editor.update(model.unhighlighted, inner)
      return {
        model: { ...model, unhighlighted: result.model },
        commands: lift((m) => Message.GotUnhighlighted({ message: m }))(result)
      }
    },
    GotBare: ({ message: inner }) => {
      const result = Editor.update(model.bare, inner)
      return { model: { ...model, bare: result.model }, commands: lift((m) => Message.GotBare({ message: m }))(result) }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 640,
    children: [
      ui.Text(h, { fw: 600, children: ["Code highlight styles"] }),
      tiptap.RichTextEditor(h, {
        editor: highlighted,
        model: model.highlighted,
        toParentMessage: (message) => Message.GotHighlighted({ message }),
        children: [richTextEditorContent]
      }),
      ui.Text(h, { fw: 600, children: ["withCodeHighlightStyles: false"] }),
      tiptap.RichTextEditor(h, {
        editor: unhighlighted,
        model: model.unhighlighted,
        toParentMessage: (message) => Message.GotUnhighlighted({ message }),
        children: [richTextEditorContent]
      }),
      ui.Text(h, { fw: 600, children: ["withTypographyStyles: false"] }),
      tiptap.RichTextEditor(h, {
        editor: bare,
        model: model.bare,
        toParentMessage: (message) => Message.GotBare({ message }),
        children: [richTextEditorContent]
      })
    ]
  })
