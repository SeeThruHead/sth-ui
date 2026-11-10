import { CaretDownIcon } from "@sth-ui/icons/icons/CaretDownIcon.ts"
import { CaretUpIcon } from "@sth-ui/icons/icons/CaretUpIcon.ts"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Carousel from "../model.ts"
import type { CarouselContext } from "../model.ts"
import { slideBox } from "./slideBox.ts"

export const Model = Schema.Struct({ carousel: Carousel.Model, plain: Carousel.Model, extra: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotCarousel: { message: Carousel.Message },
  GotPlain: { message: Carousel.Message },
  AddedSlide: {}
})
export type Message = typeof Message.Type

export const context: CarouselContext = { dragFree: true, containScroll: "keepSnaps", initialSlide: 1, duration: 200 }

export const init = (): Model => ({
  carousel: Carousel.init({ id: "vertical" }),
  plain: Carousel.init({ id: "plain" }),
  extra: 0
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotCarousel: ({ message: inner }) => {
      const result = Carousel.update(model.carousel, inner, context)

      return {
        model: { ...model, carousel: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (next) => Message.GotCarousel({ message: next }))
        )
      }
    },
    GotPlain: ({ message: inner }) => ({
      model: { ...model, plain: Carousel.update(model.plain, inner).model },
      commands: []
    }),
    AddedSlide: () => ({ model: { ...model, extra: model.extra + 1 }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    children: [
      ui.Box(h, {
        w: 260,
        children: [
          ui.Carousel(h, {
            ...context,
            model: model.carousel,
            toParentMessage: (message) => Message.GotCarousel({ message }),
            orientation: "vertical",
            type: "container",
            height: 240,
            slideSize: "50%",
            slideGap: "md",
            includeGapInSize: false,
            withIndicators: true,
            withKeyboardEvents: false,
            controlSize: 32,
            controlsOffset: "xs",
            nextControlIcon: CaretDownIcon(h, { size: 16 }),
            previousControlIcon: CaretUpIcon(h, { size: 16 }),
            nextControlLabel: "Show the next slide",
            previousControlLabel: "Show the previous slide",
            slides: Array.from({ length: 4 }, (_, index) => [slideBox(h, ui, index)])
          })
        ]
      }),
      ui.Button(h, { variant: "default", onClick: Message.AddedSlide(), children: ["Add a slide"] }),
      ui.Box(h, {
        w: 220,
        children: [
          ui.Carousel(h, {
            model: model.plain,
            toParentMessage: (message) => Message.GotPlain({ message }),
            withControls: false,
            slides: [
              [ui.TextInput(h, { id: "caption", label: "Caption", placeholder: "Type here", p: "md" })],
              [slideBox(h, ui, 6)],
              ...Array.from({ length: model.extra }, (_, index) => [slideBox(h, ui, 7 + index)])
            ]
          })
        ]
      })
    ]
  })
