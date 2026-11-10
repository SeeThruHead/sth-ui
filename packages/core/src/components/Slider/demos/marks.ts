import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as Slider from "../Slider.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: Slider.Model,
  firstValue: Schema.Finite,
  second: Slider.Model,
  secondValue: Schema.Finite
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Slider.Message },
  GotSecond: { message: Slider.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Slider.init({ id: "plain-marks" }),
  firstValue: 40,
  second: Slider.init({ id: "labelled-marks" }),
  secondValue: 40
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
    },
    GotSecond: ({ message: inner }) => {
      const result = Slider.update(model.second, inner)

      return {
        model: {
          ...model,
          second: result.model,
          secondValue: result.outMessage === undefined ? model.secondValue : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    }
  })

export const subscriptions = {
  first: Subscription.lift(Slider.subscriptions)<Model, Message>({
    read: (model) => Option.some(model.first),
    toParentMessage: (message) => Message.GotFirst({ message })
  }).dragPointer,
  second: Subscription.lift(Slider.subscriptions)<Model, Message>({
    read: (model) => Option.some(model.second),
    toParentMessage: (message) => Message.GotSecond({ message })
  }).dragPointer
}

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Slider.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: Slider.Message) => Message.GotSecond({ message })
})

const marks = [
  { value: 20, label: "20%" },
  { value: 50, label: "50%" },
  { value: 80, label: "80%" }
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Slider(h, {
        ...first(model),
        thumbLabel: "Plain marks",
        marks: [{ value: 10 }, { value: 40 }, { value: 95 }],
        mb: 32
      }),
      ui.Slider(h, { ...second(model), thumbLabel: "Labelled marks", marks, mb: 32 })
    ]
  })
