import { Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { windowEvent } from "../../browser.ts"
import { eventListener } from "../eventListener.ts"

export const Model = Schema.Struct({ key: Schema.String, clicks: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Pressed: { key: Schema.String }, Clicked: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ key: "", clicks: 0 })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Pressed: ({ key }) => ({ model: { ...model, key } }),
    Clicked: () => ({ model: { ...model, clicks: model.clicks + 1 } })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  keys: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        windowEvent<KeyboardEvent>("keydown").pipe(Stream.map((event) => Message.Pressed({ key: event.key })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { children: [model.key === "" ? "Press any key" : `Last key: ${model.key}`] }),
      h.div(
        [h.OnMount(Mount.mapMessage(eventListener("click"), () => Message.Clicked()))],
        [ui.Button(h, { variant: "default", children: [`Clicked ${model.clicks} times`] })]
      )
    ]
  })
