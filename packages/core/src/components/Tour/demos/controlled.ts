import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("controlled-tour", [
  { target: "controlled-target-1", title: "Step 1", children: ["This is the first step."] },
  { target: "controlled-target-2", title: "Step 2", children: ["This is the second step."] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "controlled-target-1", children: ["First target"] }),
          ui.Button(h, { id: "controlled-target-2", variant: "outline", children: ["Second target"] })
        ]
      }),
      ui.Group(h, {
        mt: "md",
        children: [
          ui.Button(h, { onClick: demo.startAt(0), children: ["Go to step 1"] }),
          ui.Button(h, { onClick: demo.startAt(1), children: ["Go to step 2"] })
        ]
      }),
      ui.Text(h, { size: "sm", mt: "xs", children: [`Events: ${model.events.join(", ")}`] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
