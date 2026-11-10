import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Lightbox from "../model.ts"

export const Model = Schema.Struct({ lightbox: Lightbox.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotLightbox: { message: Lightbox.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ lightbox: Lightbox.init({ id: "downloads" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Lightbox.update(model.lightbox, message.message, { slideCount: 0 })

  return {
    model: { lightbox: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotLightbox({ message: inner }))
    )
  }
}

export const sources = [
  ["data", "data:text/plain,hello"],
  ["same origin", "/downloads/report%20final.txt"],
  ["bad name", "/downloads/bad%E0%A4%A"],
  ["folder", "/downloads/"],
  ["missing", "/downloads/missing.txt"],
  ["cross origin", "https://example.com/photo.png"],
  ["refused", "javascript:void(0)"],
  ["broken", "http://[::1"]
] as const

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ...sources.map(([label, src]) =>
        ui.Button(h, {
          variant: "default",
          onClick: Message.GotLightbox({ message: Lightbox.Message.RequestedDownload({ src }) }),
          children: [label]
        })
      ),
      ui.Button(h, { onClick: Message.GotLightbox({ message: Lightbox.open() }), children: ["Open empty"] }),
      ui.Lightbox(h, {
        model: model.lightbox,
        toParentMessage: (message) => Message.GotLightbox({ message }),
        slideCount: 0,
        slides: [],
        withNavigation: false
      })
    ]
  })
