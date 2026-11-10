import { Schema } from "effect"
import * as Command from "foldkit/command"
import * as File from "foldkit/file"
import { defineMessageUnion } from "foldkit/message"
import { DialogMessage, OpenDialog } from "./dialog.ts"
import { acceptList, dragStatus, sortFiles } from "./validate.ts"
import type { DropzoneRules } from "./validate.ts"

export const Status = Schema.Literals(["idle", "accept", "reject"])

export const Model = Schema.Struct({ id: Schema.String, status: Status, windowDrag: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  DragEntered: { types: Schema.Array(Schema.String) },
  DragLeft: {},
  Dropped: { files: Schema.Array(File.File) },
  OpenedDialog: {},
  ChoseFiles: { files: Schema.Array(File.File) },
  WindowDragChanged: { dragging: Schema.Boolean }
})
export type Message = typeof Message.Type

const FileError = Schema.Struct({ code: Schema.String, message: Schema.String })

const Rejection = Schema.Struct({ file: File.File, errors: Schema.Array(FileError) })

export const OutMessage = defineMessageUnion({
  DroppedAny: { files: Schema.Array(File.File), rejections: Schema.Array(Rejection) },
  Dropped: { files: Schema.Array(File.File) },
  Rejected: { rejections: Schema.Array(Rejection) },
  FileDialogOpened: {},
  FileDialogCancelled: {}
})
export type OutMessage = typeof OutMessage.Type

export type DropzoneContext = DropzoneRules<File.File> & { readonly disabled?: boolean; readonly loading?: boolean }

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string }): Model => ({ id: config.id, status: "idle", windowDrag: false })

export const choseFiles = (message: typeof DialogMessage.Type): Message => Message.ChoseFiles({ files: message.files })

const dragRules = (context: DropzoneContext): DropzoneRules => {
  const { validator: _validator, disabled: _disabled, loading: _loading, ...rules } = context

  return rules
}

const inactive = (context: DropzoneContext) => context.disabled === true || context.loading === true

const none = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const dropped = (model: Model, files: ReadonlyArray<File.File>, context: DropzoneContext): Result => {
  const sorted = sortFiles(files, context)

  return {
    model: { ...model, status: "idle", windowDrag: false },
    commands: [],
    outMessages: [
      OutMessage.DroppedAny({ files: sorted.accepted, rejections: sorted.rejected }),
      ...(sorted.accepted.length === 0 ? [] : [OutMessage.Dropped({ files: sorted.accepted })]),
      ...(sorted.rejected.length === 0 ? [] : [OutMessage.Rejected({ rejections: sorted.rejected })])
    ]
  }
}

export const update = (model: Model, message: Message, context: DropzoneContext = {}): Result =>
  Message.match(message, {
    DragEntered: ({ types }) =>
      inactive(context)
        ? none(model)
        : none({
            ...model,
            status: dragStatus(
              types.map((type) => ({ type })),
              dragRules(context)
            )
          }),
    DragLeft: () => none({ ...model, status: "idle" }),
    Dropped: ({ files }) => (inactive(context) ? none({ ...model, status: "idle" }) : dropped(model, files, context)),
    OpenedDialog: () =>
      inactive(context)
        ? none(model)
        : {
            model,
            commands: [
              Command.mapMessage(
                OpenDialog({ accept: acceptList(context.accept), multiple: context.multiple ?? true }),
                choseFiles
              )
            ],
            outMessages: [OutMessage.FileDialogOpened()]
          },
    ChoseFiles: ({ files }) =>
      files.length === 0
        ? { model, commands: [], outMessages: [OutMessage.FileDialogCancelled()] }
        : dropped(model, files, context),
    WindowDragChanged: ({ dragging }) => none({ ...model, windowDrag: dragging })
  })

export const openDialog = (): Message => Message.OpenedDialog()
