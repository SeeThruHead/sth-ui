import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { clickOutside } from "../clickOutside.ts"

export const Model = Schema.Struct({ opened: Schema.Boolean, closedBy: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Opened: {}, Closed: { event: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ opened: true, closedBy: "" })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    Opened: () => ({ model: { ...model, opened: true } }),
    Closed: ({ event }) => ({ model: { opened: false, closedBy: event } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, { onClick: Message.Opened(), children: ["Open dropdown"] }),
      ...(model.opened
        ? [
            h.div(
              [
                h.DataAttribute("dropdown", ""),
                h.OnMount(Mount.mapMessage(clickOutside(), ({ event }) => Message.Closed({ event })))
              ],
              [ui.Paper(h, { shadow: "sm", p: "md", withBorder: true, children: ["Click outside to close"] })]
            )
          ]
        : [ui.Text(h, { c: "dimmed", children: [`Closed by ${model.closedBy}`] })])
    ]
  })
