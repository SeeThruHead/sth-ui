import { Highlight } from "@tiptap/extension-highlight"
import { StarterKit } from "@tiptap/starter-kit"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Editor from "../model.ts"
import { richTextEditorContent, richTextEditorControl, richTextEditorToolbar } from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const sample = [
  "<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>",
  '<p>A paragraph with <code>inline code</code>, a <a href="https://tiptap.dev">link</a> and <mark>highlighted text</mark>.<br>After a line break.</p>',
  "<blockquote><p>A quote</p></blockquote>",
  "<pre><code>const answer = 42</code></pre>",
  "<hr>",
  "<ol><li><p>First</p></li><li><p>Second</p></li></ol>",
  "<ul><li><p>Last list</p></li></ul>"
].join("")

export const editor = Editor.create({ extensions: [StarterKit, Highlight] })

export const Model = Schema.Struct({ editor: Editor.Model, shown: Schema.Boolean, html: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotEditor: { message: Editor.Message },
  Loaded: {},
  ToggledEditor: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  editor: Editor.init({ id: "content-editor", content: "<p>Empty for now</p>" }),
  shown: true,
  html: ""
})

const lifted = (result: Editor.Result, model: Model) => ({
  model: {
    ...model,
    editor: result.model,
    html: result.outMessages.reduce((html, out) => (out._tag === "ChangedContent" ? out.html : html), model.html)
  },
  commands: result.commands.map((command) =>
    Command.mapMessage(command, (inner) => Message.GotEditor({ message: inner }))
  )
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotEditor: ({ message: inner }) => lifted(Editor.update(model.editor, inner), model),
    Loaded: () => lifted(Editor.setContent(model.editor, sample), model),
    ToggledEditor: () => ({ model: { ...model, shown: !model.shown }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { onClick: Message.Loaded(), children: ["Load sample"] }),
          ui.Button(h, {
            variant: "default",
            onClick: Message.ToggledEditor(),
            children: [model.shown ? "Hide editor" : "Show editor"]
          })
        ]
      }),
      ...(model.shown
        ? [
            tiptap.RichTextEditor(h, {
              editor,
              model: model.editor,
              toParentMessage: (message) => Message.GotEditor({ message }),
              children: [richTextEditorToolbar({ children: [richTextEditorControl("Bold")] }), richTextEditorContent]
            })
          ]
        : []),
      ui.Text(h, { size: "xs", children: [`${model.html.length} characters of HTML`] })
    ]
  })
