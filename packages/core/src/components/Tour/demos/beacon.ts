import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo(
  "beacon-tour",
  [
    { target: "beacon-target-1", title: "Beacon 1", children: ["Click a beacon to open its step."] },
    { target: "beacon-target-2", title: "Beacon 2", children: ["Each beacon opens independently."] },
    { target: "beacon-target-3", title: "Beacon 3", children: ["Close the step to see the beacons again."] }
  ],
  { mode: "beacon", color: "teal" },
  -1
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "beacon-target-1", children: ["First target"] }),
          ui.TextInput(h, {
            id: "beacon-target-2",
            placeholder: "Second target",
            attributes: { input: { "aria-label": "Second target" } }
          }),
          ui.Button(h, { id: "beacon-target-3", variant: "outline", children: ["Third target"] })
        ]
      }),
      ui.Button(h, {
        mt: "md",
        onClick: demo.toggle(model),
        children: [model.tour.active ? "Hide beacons" : "Show beacons"]
      }),
      ui.Tour(h, demo.tour(model))
    ]
  })
