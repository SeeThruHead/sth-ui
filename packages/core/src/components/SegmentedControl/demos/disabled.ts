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
  first: SegmentedControl.init({ id: "disabled-control" }),
  firstValue: null,
  second: SegmentedControl.init({ id: "disabled-option" }),
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

const data = [
  { value: "preview", label: "Preview" },
  { value: "code", label: "Code" },
  { value: "export", label: "Export" }
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Box(h, {
        children: [
          ui.Text(h, { size: "sm", fw: 500, mb: 3, children: ["Disabled control"] }),
          ui.SegmentedControl(h, { ...first(model), ariaLabel: "Disabled control", disabled: true, data })
        ]
      }),
      ui.Box(h, {
        children: [
          ui.Text(h, { size: "sm", fw: 500, mb: 3, children: ["Disabled option"] }),
          ui.SegmentedControl(h, {
            ...second(model),
            ariaLabel: "Disabled option",
            data: [
              { value: "preview", label: "Preview", disabled: true },
              { value: "code", label: "Code" },
              { value: "export", label: "Export" }
            ]
          })
        ]
      })
    ]
  })
