import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ shown: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledPortal: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ shown: true })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledPortal: () => ({ model: { shown: !model.shown } }) })

const content = (model: Model, h: HtmlBuilder<Message>, ui: Ui): ReadonlyArray<Html> =>
  model.shown
    ? [
        ui.Portal(h, {
          target: "#portal-target",
          children: [ui.Paper(h, { withBorder: true, p: "sm", children: ["Rendered in a portal"] })]
        })
      ]
    : []

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, {
        size: "xs",
        variant: "default",
        mb: "sm",
        onClick: Message.ToggledPortal(),
        children: ["Toggle portal"]
      }),
      ...content(model, h, ui),
      ui.Paper(h, { withBorder: true, p: "sm", id: "portal-target", children: ["Target box: "] })
    ]
  })
