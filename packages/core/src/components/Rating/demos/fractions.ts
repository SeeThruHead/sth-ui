import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Rating from "../Rating.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: Rating.Model,
  firstValue: Schema.Finite,
  second: Rating.Model,
  secondValue: Schema.Finite,
  third: Rating.Model,
  thirdValue: Schema.Finite
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Rating.Message },
  GotSecond: { message: Rating.Message },
  GotThird: { message: Rating.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Rating.init({ id: "halves" }),
  firstValue: 1.5,
  second: Rating.init({ id: "thirds" }),
  secondValue: 2.33333333,
  third: Rating.init({ id: "quarters" }),
  thirdValue: 3.75
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
    },
    GotSecond: ({ message: inner }) => {
      const result = Rating.update(model.second, inner)
      const changed = result.outMessage?._tag === "Changed" ? result.outMessage.value : model.secondValue

      return {
        model: { ...model, second: result.model, secondValue: changed },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    },
    GotThird: ({ message: inner }) => {
      const result = Rating.update(model.third, inner)
      const changed = result.outMessage?._tag === "Changed" ? result.outMessage.value : model.thirdValue

      return {
        model: { ...model, third: result.model, thirdValue: changed },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotThird({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Rating.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: Rating.Message) => Message.GotSecond({ message })
})

const third = (model: Model) => ({
  model: model.third,
  value: model.thirdValue,
  toParentMessage: (message: Rating.Message) => Message.GotThird({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Group(h, {
        children: [h.div([], ["Fractions: 2"]), ui.Rating(h, { ...first(model), fractions: 2, ariaLabel: "Halves" })]
      }),
      ui.Group(h, {
        children: [h.div([], ["Fractions: 3"]), ui.Rating(h, { ...second(model), fractions: 3, ariaLabel: "Thirds" })]
      }),
      ui.Group(h, {
        children: [h.div([], ["Fractions: 4"]), ui.Rating(h, { ...third(model), fractions: 4, ariaLabel: "Quarters" })]
      })
    ]
  })
