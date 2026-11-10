import { Color, TextStyle } from "@tiptap/extension-text-style"
import { StarterKit } from "@tiptap/starter-kit"
import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import * as Editor from "../model.ts"
import {
  richTextEditorColorControl,
  richTextEditorColorPickerControl,
  richTextEditorContent,
  richTextEditorControl,
  richTextEditorControlsGroup,
  richTextEditorToolbar
} from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

export const editor = Editor.create({ extensions: [StarterKit, TextStyle, Color] })

const palette = [
  "#25262b",
  "#868e96",
  "#fa5252",
  "#e64980",
  "#be4bdb",
  "#7950f2",
  "#4c6ef5",
  "#228be6",
  "#15aabf",
  "#12b886",
  "#40c057",
  "#82c91e",
  "#fab005",
  "#fd7e14"
]

export const Model = Schema.Struct({ editor: Editor.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotEditor: { message: Editor.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  editor: Editor.init({ id: "colors-editor", content: "<p>Apply some colors to this text</p>" })
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

export const subscriptions = Subscription.lift(Editor.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.editor),
  toParentMessage: (message) => Message.GotEditor({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, _ui: Ui): Html =>
  tiptap.RichTextEditor(h, {
    editor,
    model: model.editor,
    toParentMessage: (message) => Message.GotEditor({ message }),
    children: [
      richTextEditorToolbar({
        children: [
          richTextEditorColorPickerControl({ colors: palette }),
          richTextEditorControlsGroup([
            richTextEditorColorControl("#F03E3E"),
            richTextEditorColorControl("#7048E8"),
            richTextEditorColorControl("#1098AD"),
            richTextEditorColorControl("#37B24D"),
            richTextEditorColorControl("#F59F00")
          ]),
          richTextEditorControl("UnsetColor")
        ]
      }),
      richTextEditorContent
    ]
  })
