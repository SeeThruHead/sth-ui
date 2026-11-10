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
    id: "sidebar",
    step: "20px",
    panels: [{ defaultSize: "200px", min: "120px", max: "400px" }, { defaultSize: 1 }]
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
    h: 200,
    w: 600,
    lineSize: 6,
    handleColor: "blue",
    children: [pane(h, ui, "Sidebar"), pane(h, ui, "Content")]
  })
