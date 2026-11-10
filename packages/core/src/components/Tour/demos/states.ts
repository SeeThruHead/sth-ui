import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const scroller = stylex.create({ root: { overflowY: "auto" } })

const demo = tourDemo(
  "states-tour",
  [
    { target: "states-target-1", title: "No overlay", withOverlay: false, children: ["This step has no overlay."] },
    { target: "states-target-2", spotlightPadding: 0, spotlightRadius: 0, children: ["No title, tight spotlight."] },
    { target: "states-target-3", title: "Scrolled into view" }
  ],
  {
    withCloseButton: false,
    withKeyboardNavigation: false,
    closeOnEscape: false,
    withScrollIntoView: false,
    zIndex: 400,
    maxWidth: 240,
    tooltipShadow: "xl",
    color: "grape"
  }
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "states-target-1", children: ["First target"] }),
          ui.Button(h, { id: "states-target-2", variant: "outline", children: ["Second target"] })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Box(h, {
        h: 60,
        mt: "md",
        styles: { root: scroller.root },
        children: [
          ui.Box(h, { h: 300, children: ["Scroll down"] }),
          ui.Button(h, { id: "states-target-3", children: ["Hidden target"] })
        ]
      }),
      ui.Tour(h, demo.tour(model))
    ]
  })
