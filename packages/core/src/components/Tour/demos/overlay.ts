import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo(
  "overlay-tour",
  [
    { target: "overlay-target-1", title: "First step", children: ["This is the first step of the tour."] },
    { target: "overlay-target-2", title: "Second step", children: ["This is the second step of the tour."] }
  ],
  {
    overlayColor: "rgba(0, 0, 60, 0.6)",
    spotlightPadding: 16,
    spotlightRadius: 12,
    closeOnOverlayClick: true,
    withOverlayInteraction: true
  }
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "overlay-target-1", children: ["First target"] }),
          ui.Button(h, { id: "overlay-target-2", variant: "light", children: ["Second target"] })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
