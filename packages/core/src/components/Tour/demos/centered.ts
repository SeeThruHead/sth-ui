import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("centered-tour", [
  { title: "Welcome", children: ["This step has no target, so it is centered on the screen."] },
  { target: "centered-target", title: "Target step", children: ["This step points at the button."] },
  { title: "All done", children: ["This final step is also centered with no target."] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Button(h, { id: "centered-target", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
