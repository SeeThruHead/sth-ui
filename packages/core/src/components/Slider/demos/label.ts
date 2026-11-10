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
  secondValue: Schema.Finite,
  third: Slider.Model,
  thirdValue: Schema.Finite
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Slider.Message },
  GotSecond: { message: Slider.Message },
  GotThird: { message: Slider.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Slider.init({ id: "no-label" }),
  firstValue: 40,
  second: Slider.init({ id: "formatted" }),
  secondValue: 40,
  third: Slider.init({ id: "always" }),
  thirdValue: 40
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
    },
    GotThird: ({ message: inner }) => {
      const result = Slider.update(model.third, inner)

      return {
        model: {
          ...model,
          third: result.model,
          thirdValue: result.outMessage === undefined ? model.thirdValue : result.outMessage.value
        },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotThird({ message: lifted }))
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
  }).dragPointer,
  third: Subscription.lift(Slider.subscriptions)<Model, Message>({
    read: (model) => Option.some(model.third),
    toParentMessage: (message) => Message.GotThird({ message })
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

const third = (model: Model) => ({
  model: model.third,
  value: model.thirdValue,
  toParentMessage: (message: Slider.Message) => Message.GotThird({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: 0,
    children: [
      ui.Text(h, { size: "sm", children: ["No label"] }),
      ui.Slider(h, { ...first(model), thumbLabel: "No label", label: null }),
      ui.Text(h, { size: "sm", mt: "xl", children: ["Formatted label"] }),
      ui.Slider(h, { ...second(model), thumbLabel: "Formatted label", label: (value) => `${value} °C` }),
      ui.Text(h, { size: "sm", mt: "xl", children: ["Label always visible"] }),
      ui.Slider(h, { ...third(model), thumbLabel: "Label always visible", labelAlwaysOn: true, mt: 40 })
    ]
  })
