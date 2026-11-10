import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { Option } from "effect"
import { storedValue } from "../../browser.ts"
import { BrowserMessage, removeStorage, writeStorage } from "../../commands.ts"
import { readJson } from "../storage.ts"

const key = "sth-hooks-demo-color"

export const Model = Schema.Struct({ color: Schema.String, error: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Chose: { color: Schema.String },
  Removed: {},
  Stored: { color: Schema.String },
  Got: { message: BrowserMessage }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ color: "none", error: "" })

const got = (message: BrowserMessage) => Message.Got({ message })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Chose: ({ color }) => ({
      model,
      commands: [Command.mapMessage(writeStorage({ kind: "localStorage", key, value: color }), got)]
    }),
    Removed: () => ({ model, commands: [Command.mapMessage(removeStorage({ kind: "localStorage", key }), got)] }),
    Stored: ({ color }) => ({ model: { ...model, color } }),
    Got: ({ message: result }) => ({ model: { ...model, error: result._tag === "Failed" ? result.error : "" } })
  })

const colorOf = (stored: string | null) =>
  Option.getOrElse(
    Option.map(Option.fromNullishOr(stored), (text) => String(readJson(text))),
    () => "none"
  )

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  stored: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        storedValue("localStorage", key).pipe(Stream.map((stored) => Message.Stored({ color: colorOf(stored) })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: [
          ...["teal", "grape"].map((color) =>
            ui.Button(h, { color, onClick: Message.Chose({ color }), children: [`Store ${color}`] })
          ),
          ui.Button(h, { variant: "default", onClick: Message.Removed(), children: ["Remove"] })
        ]
      }),
      ui.Text(h, { children: [`Stored color: ${model.color}`] }),
      ...(model.error === "" ? [] : [ui.Text(h, { c: "red", size: "sm", children: [model.error] })])
    ]
  })
