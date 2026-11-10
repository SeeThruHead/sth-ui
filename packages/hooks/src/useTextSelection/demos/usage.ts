import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { textSelection } from "../../browser.ts"

export const Model = Schema.Struct({ selection: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Selected: { selection: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ selection: "" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Selected: ({ selection }) => ({ model: { selection } }) })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => textSelection.pipe(Stream.map((selection) => Message.Selected({ selection })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 420,
    mx: "auto",
    children: [
      ui.Text(h, { id: "selectable", children: ["Select some of this text to see it below."] }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Selected text: ${model.selection}`] })
    ]
  })
