import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Dropzone from "../model.ts"

export const Model = Schema.Struct({
  full: Dropzone.Model,
  still: Dropzone.Model,
  active: Schema.Boolean,
  log: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFull: { message: Dropzone.Message },
  GotStill: { message: Dropzone.Message },
  ToggledActive: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  full: Dropzone.init({ id: "screen" }),
  still: Dropzone.init({ id: "still" }),
  active: true,
  log: "Drag a file over the window"
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFull: ({ message: inner }) => {
      const result = Dropzone.update(model.full, inner)
      const names = result.outMessages.flatMap((out) =>
        out._tag === "Dropped" ? out.files.map((file) => file.name) : []
      )

      return {
        model: { ...model, full: result.model, log: names.length === 0 ? model.log : `Dropped ${names.join(", ")}` },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (next) => Message.GotFull({ message: next }))
        )
      }
    },
    GotStill: ({ message: inner }) => ({
      model: { ...model, still: Dropzone.update(model.still, inner, { loading: true }).model },
      commands: []
    }),
    ToggledActive: () => ({ model: { ...model, active: !model.active }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 640,
    children: [
      ui.Switch(h, {
        id: "screen-active",
        label: "Accept files dropped anywhere",
        checked: model.active,
        onChange: () => Message.ToggledActive()
      }),
      ui.Text(h, { size: "sm", children: [model.log] }),
      ui.Dropzone(h, {
        model: model.still,
        toParentMessage: (inner) => Message.GotStill({ message: inner }),
        loading: true,
        activateOnDrag: false,
        loaderProps: { type: "dots" },
        mih: 80
      }),
      ui.DropzoneFullScreen(h, {
        model: model.full,
        toParentMessage: (inner) => Message.GotFull({ message: inner }),
        active: model.active,
        styles: { root: [], inner: [] },
        children: [ui.Text(h, { ta: "center", size: "xl", children: ["Drop files anywhere"] })]
      })
    ]
  })
