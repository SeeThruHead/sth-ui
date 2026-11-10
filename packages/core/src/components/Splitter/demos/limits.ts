import { Option, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as Splitter from "../Splitter.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ splitter: Splitter.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSplitter: { message: Splitter.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  splitter: Splitter.init({
    id: "two-panes",
    panels: [{ defaultSize: 50, min: 20, max: 80, collapsible: true }, { defaultSize: 50 }]
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

const pane = (h: HtmlBuilder<Message>, ui: Ui, label: string) =>
  ui.Center(h, { h: "100%", p: "md", children: [ui.Text(h, { children: [label] })] })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Splitter(h, {
    model: model.splitter,
    toParentMessage: (message) => Message.GotSplitter({ message }),
    h: 220,
    maw: 600,
    bd: "1px solid gray.3",
    children: [pane(h, ui, "Left pane"), pane(h, ui, "Right pane")]
  })
