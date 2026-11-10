import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { BrowserMessage, scrollIntoViewOf } from "../../commands.ts"

export const Model = Schema.Struct({ status: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Scrolled: { alignment: Schema.Literals(["start", "end", "center"]) },
  Got: { message: BrowserMessage }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ status: "idle" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Scrolled: ({ alignment }) => ({
      model: { status: "scrolling" },
      commands: [
        Command.mapMessage(
          scrollIntoViewOf("#scroll-target", { parent: "#scroll-parent", alignment, duration: 300 }),
          (result) => Message.Got({ message: result })
        )
      ]
    }),
    Got: ({ message: result }) => ({ model: { status: result._tag === "ScrollFinished" ? "finished" : "cancelled" } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: (["start", "center", "end"] as const).map((alignment) =>
          ui.Button(h, {
            variant: "default",
            onClick: Message.Scrolled({ alignment }),
            children: [`Scroll to ${alignment}`]
          })
        )
      }),
      h.div(
        [
          h.Id("scroll-parent"),
          h.Style({ height: "200px", width: "300px", overflowY: "auto", border: "1px solid var(--sth-color-gray-3)" })
        ],
        [
          h.div([h.Style({ height: "600px" })], []),
          ui.Paper(h, { id: "scroll-target", p: "md", bg: "blue.1", children: ["Hello there"] }),
          h.div([h.Style({ height: "600px" })], [])
        ]
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Status: ${model.status}`] })
    ]
  })
