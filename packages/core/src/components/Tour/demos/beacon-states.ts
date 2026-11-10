import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "beacon-states-1", children: ["Has a beacon"] }),
          ui.Button(h, { id: "beacon-states-2", variant: "outline", children: ["No beacon"] })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.toggle(model), children: ["Toggle beacons"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })

const demo = tourDemo(
  "beacon-states-tour",
  [
    { target: "beacon-states-1", children: ["A beacon without a title."] },
    { target: "beacon-states-2", withBeacon: false, title: "Hidden beacon", children: ["Never shown as a beacon."] },
    { title: "No target", children: ["Steps without a target get no beacon."] }
  ],
  { mode: "beacon" },
  -1
)

export const { init, update } = demo
