import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import { PDF_MIME_TYPE } from "../mimeTypes.ts"
import * as Dropzone from "../model.ts"
import type { DropzoneContext } from "../model.ts"

export const Model = Schema.Struct({
  dropzone: Dropzone.Model,
  full: Dropzone.Model,
  loading: Schema.Boolean,
  disabled: Schema.Boolean,
  log: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotDropzone: { message: Dropzone.Message },
  GotFull: { message: Dropzone.Message },
  ToggledLoading: {},
  ToggledDisabled: {}
})
export type Message = typeof Message.Type

const contextOf = (model: Model): DropzoneContext => ({
  accept: { "application/pdf": [".pdf"] },
  multiple: false,
  minSize: 2,
  validator: (file) =>
    file.name.startsWith("secret") ? { code: "secret", message: "Secret files are not allowed" } : null,
  loading: model.loading,
  disabled: model.disabled
})

const fullContext: DropzoneContext = { accept: PDF_MIME_TYPE, maxFiles: 2 }

export const init = (): Model => ({
  dropzone: Dropzone.init({ id: "options" }),
  full: Dropzone.init({ id: "full" }),
  loading: false,
  disabled: false,
  log: "Nothing yet"
})

const lineOf = (log: string, out: Dropzone.OutMessage) => {
  if (out._tag === "Dropped") return `Accepted ${out.files.map((file) => file.name).join(", ")}`
  if (out._tag !== "Rejected") return log

  return `Rejected ${out.rejections.flatMap((rejection) => rejection.errors.map((error) => error.code)).join(", ")}`
}

const logOf = (outs: ReadonlyArray<Dropzone.OutMessage>, fallback: string) => outs.reduce(lineOf, fallback)

const lift = (
  commands: ReadonlyArray<Command.Command<Dropzone.Message>>,
  wrap: (message: Dropzone.Message) => Message
) => commands.map((command) => Command.mapMessage(command, wrap))

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotDropzone: ({ message: inner }) => {
      const result = Dropzone.update(model.dropzone, inner, contextOf(model))

      return {
        model: { ...model, dropzone: result.model, log: logOf(result.outMessages, model.log) },
        commands: lift(result.commands, (next) => Message.GotDropzone({ message: next }))
      }
    },
    GotFull: ({ message: inner }) => {
      const result = Dropzone.update(model.full, inner, fullContext)

      return {
        model: { ...model, full: result.model, log: logOf(result.outMessages, model.log) },
        commands: lift(result.commands, (next) => Message.GotFull({ message: next }))
      }
    },
    ToggledLoading: () => ({ model: { ...model, loading: !model.loading }, commands: [] }),
    ToggledDisabled: () => ({ model: { ...model, disabled: !model.disabled }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 640,
    children: [
      ui.Group(h, {
        children: [
          ui.Switch(h, {
            id: "dz-loading",
            label: "Loading",
            checked: model.loading,
            onChange: () => Message.ToggledLoading()
          }),
          ui.Switch(h, {
            id: "dz-disabled",
            label: "Disabled",
            checked: model.disabled,
            onChange: () => Message.ToggledDisabled()
          }),
          ui.Button(h, { onClick: Message.GotDropzone({ message: Dropzone.openDialog() }), children: ["Select a PDF"] })
        ]
      }),
      ui.Dropzone(h, {
        ...contextOf(model),
        model: model.dropzone,
        toParentMessage: (inner) => Message.GotDropzone({ message: inner }),
        activateOnClick: false,
        activateOnKeyboard: false,
        dragEventsBubbling: false,
        enablePointerEvents: true,
        variant: "filled",
        acceptColor: "teal",
        rejectColor: "#ff00aa",
        radius: "lg",
        children: [ui.Text(h, { ta: "center", children: ["Drop one PDF here, or use the button"] })]
      }),
      ui.Text(h, { size: "sm", children: [model.log] }),
      ui.DropzoneFullScreen(h, {
        ...fullContext,
        model: model.full,
        toParentMessage: (inner) => Message.GotFull({ message: inner }),
        withinPortal: false,
        zIndex: 300,
        children: [ui.Text(h, { ta: "center", size: "xl", children: ["Drop PDFs anywhere"] })]
      })
    ]
  })
