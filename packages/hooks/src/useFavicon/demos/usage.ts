import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { setFavicon } from "../../commands.ts"

const icons = [
  { label: "SVG favicon", url: "/favicon.svg" },
  { label: "PNG favicon", url: "/logo.png" },
  { label: "WebP favicon", url: "/icon.webp" }
]

export const Model = Schema.Struct({ url: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Chose: { url: Schema.String }, Ignored: {} })
export type Message = typeof Message.Type

const ignore = () => Message.Ignored()

export const init = (): Model => ({ url: "" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Chose: ({ url }) => ({ model: { url }, commands: [Command.mapMessage(setFavicon({ url }), ignore)] }),
    Ignored: () => ({ model })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: icons.map(({ label, url }) =>
          ui.Button(h, {
            variant: model.url === url ? "filled" : "default",
            onClick: Message.Chose({ url }),
            children: [label]
          })
        )
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [model.url === "" ? "Pick a favicon" : `Favicon: ${model.url}`] })
    ]
  })
