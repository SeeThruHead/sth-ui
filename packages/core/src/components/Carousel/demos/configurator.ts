import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"
import * as Carousel from "../model.ts"
import type { CarouselContext } from "../model.ts"
import { slideBox } from "./slideBox.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "orientation",
      options: ["horizontal", "vertical"],
      initial: "horizontal",
      library: "horizontal"
    },
    { type: "size", prop: "slideGap", initial: "md" },
    { type: "size", prop: "controlsOffset", initial: "sm" },
    { type: "number", prop: "controlSize", initial: 26, min: 14, max: 40 },
    { type: "boolean", prop: "withControls", initial: true },
    { type: "boolean", prop: "withIndicators", initial: false }
  ],
  code: `ui.Carousel(h, {
{{props}}  model: model.carousel,
  toParentMessage: (message) => Message.GotCarousel({ message }),
  height: 200,
  slides: Array.from({ length: 5 }, (_, index) => [slideBox(h, ui, index)])
})`
})

export const Model = Schema.Struct({ carousel: Carousel.Model, log: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotCarousel: { message: Carousel.Message } })
export type Message = typeof Message.Type

export const context: CarouselContext = {}

export const init = (): Model => ({ carousel: Carousel.init({ id: "carousel" }), log: "On slide 1" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Carousel.update(model.carousel, message.message, context)
  const changed = result.outMessages.flatMap((out) =>
    out._tag === "SlideChanged" ? [`On slide ${out.index + 1}`] : []
  )

  return {
    model: { carousel: result.model, log: changed[0] ?? model.log },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotCarousel({ message: inner }))
    )
  }
}

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Stack(h, {
    maw: 520,
    children: [
      ui.Carousel(h, {
        ...context,
        model: model.carousel,
        toParentMessage: (message) => Message.GotCarousel({ message }),
        height: 200,
        slides: Array.from({ length: 5 }, (_, index) => [slideBox(h, ui, index)]),
        ...props
      }),
      ui.Text(h, { size: "sm", children: [model.log] })
    ]
  })
