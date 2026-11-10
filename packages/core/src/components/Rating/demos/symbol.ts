import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { MoonIcon } from "@sth-ui/icons/icons/MoonIcon.ts"
import { SunIcon } from "@sth-ui/icons/icons/SunIcon.ts"
import * as Rating from "../Rating.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Rating.Model, firstValue: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Rating.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Rating.init({ id: "sun-moon" }),
  firstValue: 0
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
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Rating.Message) => Message.GotFirst({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Rating(h, { ...first(model), emptySymbol: SunIcon(h, { size: 16 }), fullSymbol: MoonIcon(h, { size: 16 }) })
