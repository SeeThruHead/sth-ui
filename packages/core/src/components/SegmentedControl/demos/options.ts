import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as SegmentedControl from "../SegmentedControl.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: SegmentedControl.Model,
  firstValue: Schema.NullOr(Schema.String),
  second: SegmentedControl.Model,
  secondValue: Schema.NullOr(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: SegmentedControl.Message },
  GotSecond: { message: SegmentedControl.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: SegmentedControl.init({ id: "vertical" }),
  firstValue: null,
  second: SegmentedControl.init({ id: "full" }),
  secondValue: null
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = SegmentedControl.update(model.first, inner)

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
      const result = SegmentedControl.update(model.second, inner)

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

const first = (model: Model) => ({
  model: model.first,
  ...(model.firstValue === null ? {} : { value: model.firstValue }),
  toParentMessage: (message: SegmentedControl.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  ...(model.secondValue === null ? {} : { value: model.secondValue }),
  toParentMessage: (message: SegmentedControl.Message) => Message.GotSecond({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.SegmentedControl(h, {
        ...first(model),
        ariaLabel: "Vertical",
        orientation: "vertical",
        size: "lg",
        radius: "xl",
        name: "vertical",
        withItemsBorders: false,
        data: ["React", "Angular", "Vue", "Svelte"]
      }),
      ui.SegmentedControl(h, {
        ...second(model),
        fullWidth: true,
        orientation: "vertical",
        color: "rebeccapurple",
        autoContrast: true,
        data: ["React", "Angular", "Vue", "Svelte"]
      })
    ]
  })
