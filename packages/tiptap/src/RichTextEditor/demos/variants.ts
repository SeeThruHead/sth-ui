import { Placeholder } from "@tiptap/extensions"
import { StarterKit } from "@tiptap/starter-kit"
import { LinkSimpleIcon } from "@sth-ui/icons/icons/LinkSimpleIcon.ts"
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
  richTextEditorCustomControl,
  richTextEditorLinkControl,
  richTextEditorTableInsertControl,
  richTextEditorToolbar
} from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const editor = Editor.create({
  extensions: [StarterKit, Placeholder.configure({ placeholder: "Write something" })]
})

export const Model = Schema.Struct({ editor: Editor.Model, starred: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotEditor: { message: Editor.Message }, ToggledStar: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ editor: Editor.init({ id: "variants-editor" }), starred: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    ToggledStar: () => ({ model: { ...model, starred: !model.starred }, commands: [] }),
    GotEditor: ({ message: inner }) => {
      const result = Editor.update(model.editor, inner)

      return {
        model: { ...model, editor: result.model },
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
    variant: "subtle",
    labels: { boldControlLabel: "Make bold" },
    children: [
      richTextEditorToolbar({
        children: [
          richTextEditorControl("Bold"),
          richTextEditorLinkControl({ disableTooltips: true, icon: LinkSimpleIcon }),
          richTextEditorControlsGroup([
            richTextEditorControl("TaskList"),
            richTextEditorControl("TaskListSink"),
            richTextEditorControl("TableDelete"),
            richTextEditorTableInsertControl()
          ]),
          richTextEditorControlsGroup([
            richTextEditorCustomControl({
              label: "Star",
              active: model.starred,
              onClick: Message.ToggledStar(),
              children: ["★"]
            }),
            richTextEditorCustomControl({ label: "Status", interactive: false, children: ["Draft"] }),
            richTextEditorCustomControl({ label: "Locked", disabled: true, children: ["🔒"] })
          ])
        ]
      }),
      richTextEditorContent
    ]
  })
