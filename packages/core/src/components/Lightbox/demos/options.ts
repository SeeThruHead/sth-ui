import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import type { LightboxSlideData } from "../Lightbox.ts"
import * as Lightbox from "../model.ts"
import type { LightboxContext } from "../model.ts"
import { pictures } from "./pictures.ts"

export const Model = Schema.Struct({ lightbox: Lightbox.Model, liked: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotLightbox: { message: Lightbox.Message }, Liked: {} })
export type Message = typeof Message.Type

export const context: LightboxContext = {
  slideCount: 4,
  loop: true,
  withThumbnails: true,
  withSlideTransition: true
}

export const init = (): Model => ({
  lightbox: Lightbox.init({ id: "options-lightbox", withThumbnails: true }),
  liked: 0
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotLightbox: ({ message: inner }) => {
      const result = Lightbox.update(model.lightbox, inner, context)

      return {
        model: { ...model, lightbox: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (next) => Message.GotLightbox({ message: next }))
        )
      }
    },
    Liked: () => ({ model: { ...model, liked: model.liked + 1 }, commands: [] })
  })

const send = (message: Lightbox.Message) => Message.GotLightbox({ message })

const slides = (h: HtmlBuilder<Message>, ui: Ui, liked: number): ReadonlyArray<LightboxSlideData> => [
  {
    src: pictures[0]?.src ?? "",
    srcSet: `${pictures[0]?.src ?? ""} 1x`,
    sizes: "100vw",
    loading: "eager",
    renderThumb: (active) => ui.Text(h, { size: "xs", c: active ? "white" : "dimmed", children: ["First"] })
  },
  {
    type: "video",
    src: "data:video/mp4;base64,",
    label: "A short clip",
    poster: pictures[1]?.src ?? "",
    autoPlay: true,
    caption: "A short clip",
    tracks: [
      { src: "data:text/vtt,WEBVTT", srcLang: "en", label: "English", default: true },
      { src: "data:text/vtt,WEBVTT", kind: "captions" }
    ]
  },
  {
    type: "custom",
    caption: "Anything can go in a slide",
    render: (active) =>
      ui.Stack(h, {
        align: "center",
        children: [
          ui.Title(h, { order: 3, c: "white", children: [active ? "A custom slide" : "Waiting"] }),
          ui.TextInput(h, { id: "note", label: "Note", placeholder: "Arrow keys stay here" }),
          ui.Button(h, { onClick: Message.Liked(), children: [`Like (${liked})`] })
        ]
      })
  },
  { type: "video", src: "data:video/mp4;base64," }
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Button(h, { onClick: send(Lightbox.open(2)), children: ["Open the custom slide"] }),
      ui.Lightbox(h, {
        ...context,
        model: model.lightbox,
        toParentMessage: send,
        slides: slides(h, ui, model.liked),
        closeOnClickOutside: true,
        withDownload: true,
        withinPortal: false,
        returnFocus: false,
        zIndex: 500,
        transitionDuration: 100,
        labels: { lightboxLabel: "Album", closeLabel: "Close album" },
        toolbarItems: (defaults) => [
          ...defaults,
          { key: "like", icon: "♥", label: "Like this", onClick: Message.Liked(), position: "left" }
        ]
      })
    ]
  })
