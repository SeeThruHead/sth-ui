import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as PinInput from "../PinInput.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: PinInput.Model,
  firstValue: Schema.String,
  second: PinInput.Model,
  secondValue: Schema.String,
  third: PinInput.Model,
  thirdValue: Schema.String,
  fourth: PinInput.Model,
  fourthValue: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: PinInput.Message },
  GotSecond: { message: PinInput.Message },
  GotThird: { message: PinInput.Message },
  GotFourth: { message: PinInput.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: PinInput.init({ id: "masked" }),
  firstValue: "12",
  second: PinInput.init({ id: "wrong" }),
  secondValue: "9876",
  third: PinInput.init({ id: "locked" }),
  thirdValue: "42",
  fourth: PinInput.init({ id: "long" }),
  fourthValue: ""
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = PinInput.update(model.first, inner)

      return {
        model: {
          ...model,
          first: result.model,
          firstValue: result.outMessage === undefined ? model.firstValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    },
    GotSecond: ({ message: inner }) => {
      const result = PinInput.update(model.second, inner)

      return {
        model: {
          ...model,
          second: result.model,
          secondValue: result.outMessage === undefined ? model.secondValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    },
    GotThird: ({ message: inner }) => {
      const result = PinInput.update(model.third, inner)

      return {
        model: {
          ...model,
          third: result.model,
          thirdValue: result.outMessage === undefined ? model.thirdValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotThird({ message: lifted }))
        )
      }
    },
    GotFourth: ({ message: inner }) => {
      const result = PinInput.update(model.fourth, inner)

      return {
        model: {
          ...model,
          fourth: result.model,
          fourthValue: result.outMessage === undefined ? model.fourthValue : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFourth({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: PinInput.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: PinInput.Message) => Message.GotSecond({ message })
})

const third = (model: Model) => ({
  model: model.third,
  value: model.thirdValue,
  toParentMessage: (message: PinInput.Message) => Message.GotThird({ message })
})

const fourth = (model: Model) => ({
  model: model.fourth,
  value: model.fourthValue,
  toParentMessage: (message: PinInput.Message) => Message.GotFourth({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.PinInput(h, { ...first(model), ariaLabel: "Masked", mask: true, type: "number" }),
      ui.PinInput(h, { ...second(model), ariaLabel: "Wrong", error: true, manageFocus: false }),
      ui.PinInput(h, { ...third(model), ariaLabel: "Disabled", disabled: true }),
      ui.PinInput(h, {
        ...fourth(model),
        ariaLabel: "Six digits",
        length: 6,
        size: "lg",
        radius: "md",
        gap: "xs",
        placeholder: "",
        oneTimeCode: false,
        name: "otp"
      })
    ]
  })
