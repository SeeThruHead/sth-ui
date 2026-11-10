import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { BrowserMessage, scrollIntoViewOf } from "../../commands.ts"

export const Model = Schema.Struct({ status: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Page: {}, Sideways: {}, Missing: {}, Got: { message: BrowserMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ status: "idle" })

const got = (result: BrowserMessage) => Message.Got({ message: result })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Page: () => ({
      model: { status: "scrolling" },
      commands: [
        Command.mapMessage(scrollIntoViewOf("#page-target", { duration: 0, cancelable: false, offset: 20 }), got)
      ]
    }),
    Sideways: () => ({
      model: { status: "scrolling" },
      commands: [
        Command.mapMessage(
          scrollIntoViewOf("#side-target", { parent: "#side-parent", axis: "x", alignment: "center", duration: 200 }),
          got
        )
      ]
    }),
    Missing: () => ({
      model: { status: "scrolling" },
      commands: [Command.mapMessage(scrollIntoViewOf("#missing", {}), got)]
    }),
    Got: ({ message: result }) => ({ model: { status: result._tag === "ScrollFinished" ? "finished" : "cancelled" } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { variant: "default", onClick: Message.Page(), children: ["Scroll the page"] }),
          ui.Button(h, { variant: "default", onClick: Message.Sideways(), children: ["Scroll sideways"] }),
          ui.Button(h, { variant: "default", onClick: Message.Missing(), children: ["Scroll to nothing"] })
        ]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Status: ${model.status}`] }),
      h.div(
        [h.Id("side-parent"), h.Style({ width: "300px", overflowX: "auto", whiteSpace: "nowrap" })],
        [
          h.span([h.Style({ display: "inline-block", width: "800px" })], []),
          h.span([h.Id("side-target")], ["Over here"])
        ]
      ),
      h.div([h.Style({ height: "150vh" })], []),
      ui.Paper(h, { id: "page-target", p: "md", withBorder: true, children: ["Bottom of the page"] })
    ]
  })
