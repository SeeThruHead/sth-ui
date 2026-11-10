import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Rating from "../Rating.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "yellow", library: "yellow" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "number", prop: "count", initial: 5, library: 5, min: 1, max: 8 },
    { type: "boolean", prop: "highlightSelectedOnly", initial: false, library: false }
  ],
  code: `ui.Rating(h, {
{{props}}})`
})

export const Model = Schema.Struct({ first: Rating.Model, firstValue: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Rating.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Rating.init({ id: "usage" }),
  firstValue: 2
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Rating.update(model.first, inner)
      const changed = result.outMessage?._tag === "Changed" ? result.outMessage.value : model.firstValue

      return {
        model: { ...model, first: result.model, firstValue: changed },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Rating.Message) => Message.GotFirst({ message })
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.Rating(h, { ...first(model), ...props })
