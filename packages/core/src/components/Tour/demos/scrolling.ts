import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const scroller = stylex.create({ root: { overflowY: "auto" } })

const demo = tourDemo(
  "scrolling-tour",
  [{ target: "scrolling-target", title: "Scrolled into view", children: ["The tour scrolled this target into view."] }],
  { unstyled: true }
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, { onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Box(h, {
        h: 60,
        mt: "md",
        styles: { root: scroller.root },
        children: [
          ui.Box(h, { h: 300, children: ["Scroll down"] }),
          ui.Button(h, { id: "scrolling-target", children: ["Hidden target"] })
        ]
      }),
      ui.Tour(h, demo.tour(model))
    ]
  })
