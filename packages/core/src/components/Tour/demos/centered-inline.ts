import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("inline-tour", [
  { title: "Inline welcome", children: ["No overlay, no portal: the tooltip itself takes focus."] },
  { target: "inline-target", title: "Inline target", children: ["This step points at the button."] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, { id: "inline-target", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, { ...demo.tour(model), withOverlay: false, withinPortal: false, stepTransitionDuration: 150 })
    ]
  })
