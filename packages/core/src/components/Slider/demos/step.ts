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
  first: Slider.init({ id: "decimal-step", min: -10, max: 10, step: 0.1 }),
  firstValue: 0,
  second: Slider.init({ id: "mark-step", step: 25 }),
  secondValue: 50
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

const sizeLabels = ["xs", "sm", "md", "lg", "xl"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: 0,
    children: [
      ui.Text(h, { children: ["Decimal step"] }),
      ui.Slider(h, { ...first(model), thumbLabel: "Decimal step", label: (value) => value.toFixed(1) }),
      ui.Text(h, { mt: "md", children: ["Step matched with marks"] }),
      ui.Slider(h, {
        ...second(model),
        thumbLabel: "Step matched with marks",
        label: (value) => sizeLabels[value / 25] ?? "",
        marks: sizeLabels.map((_, index) => ({ value: index * 25 }))
      })
    ]
  })
