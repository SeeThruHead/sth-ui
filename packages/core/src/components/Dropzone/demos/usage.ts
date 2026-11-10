import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { UploadIcon } from "@sth-ui/icons/icons/UploadIcon.ts"
import { XIcon } from "@sth-ui/icons/icons/XIcon.ts"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import { IMAGE_MIME_TYPE } from "../mimeTypes.ts"
import * as Dropzone from "../model.ts"
import type { DropzoneContext } from "../model.ts"

export const Model = Schema.Struct({ dropzone: Dropzone.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotDropzone: { message: Dropzone.Message } })
export type Message = typeof Message.Type

export const context: DropzoneContext = { accept: IMAGE_MIME_TYPE, maxSize: 5 * 1024 ** 2 }

export const init = (): Model => ({ dropzone: Dropzone.init({ id: "dropzone" }), log: "No files yet" })

const describe = (out: Dropzone.OutMessage): ReadonlyArray<string> =>
  Dropzone.OutMessage.match(out, {
    DroppedAny: () => [],
    Dropped: ({ files }) => [`Accepted ${files.map((file) => file.name).join(", ")}`],
    Rejected: ({ rejections }) => [
      `Rejected ${rejections.map((rejection) => `${rejection.file.name} (${rejection.errors.map((error) => error.message).join(", ")})`).join(", ")}`
    ],
    FileDialogOpened: () => [],
    FileDialogCancelled: () => ["Cancelled"]
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Dropzone.update(model.dropzone, message.message, context)
  const lines = result.outMessages.flatMap(describe)

  return {
    model: { dropzone: result.model, log: lines.length === 0 ? model.log : lines.join("; ") },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotDropzone({ message: inner }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 640,
    children: [
      ui.Dropzone(h, {
        ...context,
        model: model.dropzone,
        toParentMessage: (message) => Message.GotDropzone({ message }),
        children: [
          ui.Group(h, {
            justify: "center",
            gap: "xl",
            mih: 160,
            children: [
              ui.DropzoneAccept(h, { model: model.dropzone, children: [UploadIcon(h, { size: 52 })] }),
              ui.DropzoneReject(h, { model: model.dropzone, children: [XIcon(h, { size: 52 })] }),
              ui.DropzoneIdle(h, { model: model.dropzone, children: [ImageIcon(h, { size: 52 })] }),
              h.div(
                [],
                [
                  ui.Text(h, { size: "xl", children: ["Drag images here or click to select files"] }),
                  ui.Text(h, {
                    size: "sm",
                    c: "dimmed",
                    mt: 7,
                    children: ["Attach as many files as you like, each file should not exceed 5mb"]
                  })
                ]
              )
            ]
          })
        ]
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
