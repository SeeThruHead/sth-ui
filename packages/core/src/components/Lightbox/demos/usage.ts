import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Lightbox from "../model.ts"
import type { LightboxContext } from "../model.ts"
import { pictures } from "./pictures.ts"

export const Model = Schema.Struct({ lightbox: Lightbox.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotLightbox: { message: Lightbox.Message } })
export type Message = typeof Message.Type

export const context: LightboxContext = {
  slideCount: pictures.length,
  withZoom: true,
  withThumbnails: true,
  withFullscreen: true
}

export const init = (): Model => ({ lightbox: Lightbox.init({ id: "lightbox", withThumbnails: true }), log: "Closed" })

const describe = (out: Lightbox.OutMessage) =>
  Lightbox.OutMessage.match(out, {
    IndexChanged: ({ index }) => `Showing ${index + 1}`,
    LightboxOpened: () => "Opened",
    LightboxClosed: () => "Closed"
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Lightbox.update(model.lightbox, message.message, context)

  return {
    model: { lightbox: result.model, log: result.outMessages.map(describe).at(-1) ?? model.log },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotLightbox({ message: inner }))
    )
  }
}

const send = (message: Lightbox.Message) => Message.GotLightbox({ message })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.SimpleGrid(h, {
        cols: 3,
        maw: 480,
        children: pictures.map((picture, index) =>
          h.button(
            [
              h.Type("button"),
              h.AriaLabel(`Open ${picture.alt}`),
              h.Style({ padding: "0", border: "0", cursor: "pointer", background: "none" }),
              h.OnClick(send(Lightbox.open(index)))
            ],
            [ui.Image(h, { src: picture.src, alt: "", h: 90, fit: "cover", radius: "sm" })]
          )
        )
      }),
      ui.Text(h, { size: "sm", children: [model.log] }),
      ui.Lightbox(h, {
        ...context,
        model: model.lightbox,
        toParentMessage: send,
        slides: pictures,
        withDownload: true
      })
    ]
  })
