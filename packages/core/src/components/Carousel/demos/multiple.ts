import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Carousel from "../model.ts"
import type { CarouselContext } from "../model.ts"
import { slideBox } from "./slideBox.ts"

export const Model = Schema.Struct({ carousel: Carousel.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotCarousel: { message: Carousel.Message } })
export type Message = typeof Message.Type

export const context: CarouselContext = { loop: true, align: "start", slidesToScroll: 1 }

export const init = (): Model => ({ carousel: Carousel.init({ id: "multiple" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Carousel.update(model.carousel, message.message, context)

  return {
    model: { carousel: result.model },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotCarousel({ message: inner }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 720,
    children: [
      ui.Carousel(h, {
        ...context,
        model: model.carousel,
        toParentMessage: (message) => Message.GotCarousel({ message }),
        slideSize: { base: "50%", sm: "33.333333%" },
        slideGap: { base: "xs", sm: "md" },
        withIndicators: true,
        draggable: false,
        slides: Array.from({ length: 6 }, (_, index) => [slideBox(h, ui, index)])
      })
    ]
  })
