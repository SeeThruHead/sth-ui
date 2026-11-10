import { Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { fullscreen } from "../../browser.ts"
import { BrowserMessage, toggleFullscreen } from "../../commands.ts"

export const Model = Schema.Struct({ fullscreen: Schema.Boolean, error: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { fullscreen: Schema.Boolean },
  Toggled: {},
  Got: { message: BrowserMessage }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ fullscreen: false, error: "" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Changed: (changed) => ({ model: { ...model, fullscreen: changed.fullscreen } }),
    Toggled: () => ({
      model,
      commands: [
        Command.mapMessage(toggleFullscreen({ selector: "#fullscreen-target" }), (result) =>
          Message.Got({ message: result })
        )
      ]
    }),
    Got: ({ message: result }) => ({ model: { ...model, error: result._tag === "Failed" ? result.error : "" } })
  })

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  watch: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => fullscreen.pipe(Stream.map((now) => Message.Changed({ fullscreen: now })))
    }
  )
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Paper(h, {
        id: "fullscreen-target",
        p: "md",
        withBorder: true,
        children: [
          ui.Button(h, {
            color: model.fullscreen ? "red" : "blue",
            onClick: Message.Toggled(),
            children: [model.fullscreen ? "Exit fullscreen" : "Enter fullscreen"]
          })
        ]
      }),
      ...(model.error === "" ? [] : [ui.Text(h, { c: "red", size: "sm", children: [model.error] })])
    ]
  })
