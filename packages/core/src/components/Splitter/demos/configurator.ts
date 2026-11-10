import { Option, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as Splitter from "../Splitter.ts"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "orientation",
      options: ["horizontal", "vertical"],
      initial: "horizontal",
      library: "horizontal"
    }
  ],
  code: `Splitter.init({
  id: "usage",
{{props}}  panels: [
    { defaultSize: 50, min: 20 },
    { defaultSize: 50, min: 20 }
  ]
})`
})

export const Model = Schema.Struct({ splitter: Splitter.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSplitter: { message: Splitter.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  splitter: Splitter.init({
    id: "usage",
    panels: [
      { defaultSize: 50, min: 20 },
      { defaultSize: 50, min: 20 }
    ]
  })
})

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotSplitter: ({ message: inner }) => ({ model: { splitter: Splitter.update(model.splitter, inner).model } })
  })

export const subscriptions = Subscription.lift(Splitter.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.splitter),
  toParentMessage: (message) => Message.GotSplitter({ message })
})

const pane = (h: HtmlBuilder<Message>, ui: Ui, label: string, color: string) =>
  ui.Center(h, { h: "100%", bg: color, c: "white", children: [label] })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Splitter(h, {
    model: { ...model.splitter, orientation: props.orientation },
    toParentMessage: (message) => Message.GotSplitter({ message }),
    h: 200,
    w: "100%",
    maw: 600,
    children: [pane(h, ui, "First pane", "blue"), pane(h, ui, "Second pane", "teal")]
  })
