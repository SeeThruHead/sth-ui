import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { collapseInnerStyle, collapseStyle } from "../collapse.ts"

export const Model = Schema.Struct({ expanded: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ expanded: false })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Toggled: () => ({ model: { expanded: !model.expanded } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.Button(h, { onClick: Message.Toggled(), children: [model.expanded ? "Collapse" : "Expand"] }),
      h.div(
        [
          h.Style(collapseStyle({ expanded: model.expanded, transitionDuration: 300 })),
          h.DataAttribute("collapse", "")
        ],
        [
          h.div(
            [h.Style(collapseInnerStyle)],
            [ui.Text(h, { children: ["From Bulbasaur to Charizard, every starter evolves twice."] })]
          )
        ]
      )
    ]
  })
