import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ visible: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ToggledOverlay: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: true })

export const update = (model: Model, message: Message) =>
  Message.match(message, { ToggledOverlay: () => ({ model: { visible: !model.visible } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    children: [
      ui.AspectRatio(h, {
        ratio: 16 / 9,
        maw: 400,
        mx: "auto",
        pos: "relative",
        children: [
          h.img([h.Src("images/sailing.svg"), h.Alt("A boat sailing past the mountains")]),
          ...(model.visible
            ? [
                ui.Overlay(h, {
                  color: "#000",
                  backgroundOpacity: 0.85,
                  attributes: { root: { "aria-label": "Dark overlay", role: "presentation" } }
                })
              ]
            : [])
        ]
      }),
      ui.Button(h, {
        onClick: Message.ToggledOverlay(),
        fullWidth: true,
        maw: 200,
        mx: "auto",
        mt: "xl",
        children: ["Toggle overlay"]
      })
    ]
  })
