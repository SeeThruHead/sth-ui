import { Image } from "@tiptap/extension-image"
import { StarterKit } from "@tiptap/starter-kit"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { ImageUploads } from "../../upload.ts"
import type { ImageUploadResult } from "../../upload.ts"
import * as Editor from "../model.ts"
import { richTextEditorContent, richTextEditorImageUploadControl, richTextEditorToolbar } from "../RichTextEditor.ts"
import { tiptap } from "../../Tiptap.ts"

const upload = (file: File): Promise<string | ImageUploadResult> => {
  if (file.name.startsWith("fail")) return Promise.reject(new Error(`Could not upload ${file.name}`))
  if (file.name.startsWith("logo")) return Promise.resolve({ src: "images/avatar-2.svg", alt: file.name })

  return Promise.resolve("images/avatar-1.svg")
}

export const editor = Editor.create({
  extensions: [
    StarterKit,
    Image,
    ImageUploads.configure({ onImageUpload: upload, onImageUploadError: () => undefined })
  ]
})

export const plainEditor = Editor.create({ extensions: [StarterKit, Image] })

export const Model = Schema.Struct({ editor: Editor.Model, plain: Editor.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotEditor: { message: Editor.Message },
  GotPlain: { message: Editor.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  editor: Editor.init({ id: "images-editor", content: "<p>Upload an image</p>" }),
  plain: Editor.init({ id: "plain-editor", content: "<p>No uploads here</p>" })
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotEditor: ({ message: inner }) => {
      const result = Editor.update(model.editor, inner)

      return {
        model: { ...model, editor: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotEditor({ message: lifted }))
        )
      }
    },
    GotPlain: ({ message: inner }) => {
      const result = Editor.update(model.plain, inner)

      return {
        model: { ...model, plain: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotPlain({ message: lifted }))
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
        children: [richTextEditorToolbar({ children: [richTextEditorImageUploadControl()] }), richTextEditorContent]
      }),
      tiptap.RichTextEditor(h, {
        editor: plainEditor,
        model: model.plain,
        toParentMessage: (message) => Message.GotPlain({ message }),
        children: [
          richTextEditorToolbar({ children: [richTextEditorImageUploadControl({ accept: "image/png" })] }),
          richTextEditorContent
        ]
      })
    ]
  })
