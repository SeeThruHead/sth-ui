import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as Slider from "../Slider.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "xl", library: "xl" },
    { type: "boolean", prop: "showLabelOnHover", initial: true, library: true },
    { type: "boolean", prop: "labelAlwaysOn", initial: false, library: false }
  ],
  code: `ui.Slider(h, {
{{props}}  thumbLabel: "Volume",
  marks,
  mb: 32
})`
})

export const Model = Schema.Struct({ first: Slider.Model, firstValue: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Slider.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Slider.init({ id: "usage" }),
  firstValue: 40
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Slider.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

export const subscriptions = {
  first: Subscription.lift(Slider.subscriptions)<Model, Message>({
    read: (model) => Option.some(model.first),
    toParentMessage: (message) => Message.GotFirst({ message })
  }).dragPointer
}

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Slider.Message) => Message.GotFirst({ message })
})

const marks = [
  { value: 20, label: "20%" },
  { value: 50, label: "50%" },
  { value: 80, label: "80%" }
]

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.Slider(h, { ...first(model), thumbLabel: "Volume", marks, mb: 32, ...props })
