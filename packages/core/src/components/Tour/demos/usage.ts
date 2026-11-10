import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("usage-tour", [
  { target: "usage-target-1", title: "Step 1", children: ["This is the first step of the tour."] },
  { target: "usage-target-2", title: "Step 2", children: ["This is the second step of the tour."] },
  { target: "usage-target-3", title: "Step 3", children: ["This is the third and final step."] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "usage-target-1", children: ["First target"] }),
          ui.TextInput(h, {
            id: "usage-target-2",
            placeholder: "Second target",
            attributes: { input: { "aria-label": "Second target" } }
          }),
          ui.Button(h, { id: "usage-target-3", variant: "outline", children: ["Third target"] })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
