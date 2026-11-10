import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("position-tour", [
  { target: "position-target", title: "Bottom", position: "bottom", children: ["Tooltip below the target."] },
  { target: "position-target", title: "Top", position: "top", children: ["Tooltip above the target."] },
  { target: "position-target", title: "Left", position: "left", children: ["Tooltip to the left."] },
  { target: "position-target", title: "Right", position: "right", children: ["Tooltip to the right."] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Center(h, {
    h: 200,
    children: [
      ui.Button(h, { id: "position-target", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
