import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Combobox from "../Combobox.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  first: Combobox.Model,
  firstValue: Schema.NullOr(Schema.String),
  second: Combobox.Model,
  secondValue: Schema.NullOr(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFirst: { message: Combobox.Message },
  GotSecond: { message: Combobox.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Combobox.init({ id: "sizes", inputValue: "Medium" }),
  firstValue: "md",
  second: Combobox.init({ id: "locked" }),
  secondValue: null
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Combobox.update(model.first, inner)
      const chosen = result.outMessage?._tag === "Selected" ? result.outMessage.value : model.firstValue

      return {
        model: { ...model, first: result.model, firstValue: chosen },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    },
    GotSecond: ({ message: inner }) => {
      const result = Combobox.update(model.second, inner)
      const chosen = result.outMessage?._tag === "Selected" ? result.outMessage.value : model.secondValue

      return {
        model: { ...model, second: result.model, secondValue: chosen },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotSecond({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Combobox.Message) => Message.GotFirst({ message })
})

const second = (model: Model) => ({
  model: model.second,
  value: model.secondValue,
  toParentMessage: (message: Combobox.Message) => Message.GotSecond({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Combobox(h, {
        ...first(model),
        label: "Size",
        ariaLabel: "Size",
        description: "One size per order",
        error: "Pick again",
        size: "lg",
        radius: "xl",
        variant: "filled",
        withCheckIcon: false,
        withChevron: false,
        name: "size",
        limit: 2,
        filter: (query, item) => item.value.startsWith(query),
        data: [
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium", group: "Made to order" },
          { value: "lg", label: "Large", disabled: true }
        ]
      }),
      ui.Combobox(h, {
        ...second(model),
        ariaLabel: "Locked",
        required: true,
        withAsterisk: false,
        withinPortal: false,
        inputWrapperOrder: ["input", "label"],
        disabled: true,
        hiddenDropdown: true,
        data: ["One"]
      })
    ]
  })
