import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as PinInput from "../PinInput.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "number", prop: "length", initial: 4, library: 4, min: 1, max: 5 },
    { type: "boolean", prop: "mask", initial: false, library: false },
    { type: "string", prop: "placeholder", initial: "\u25cb", library: "\u25cb" },
    { type: "boolean", prop: "disabled", initial: false, library: false },
    { type: "boolean", prop: "error", initial: false, library: false },
    {
      type: "select",
      prop: "type",
      options: ["alphanumeric", "number"],
      initial: "alphanumeric",
      library: "alphanumeric"
    }
  ],
  code: `ui.PinInput(h, {
{{props}}  ariaLabel: "Security code"
})`
})

export const Model = Schema.Struct({ first: PinInput.Model, firstValue: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: PinInput.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: PinInput.init({ id: "code" }),
  firstValue: ""
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
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: PinInput.Message) => Message.GotFirst({ message })
})

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.PinInput(h, { ...first(model), ariaLabel: "Security code", ...props })
