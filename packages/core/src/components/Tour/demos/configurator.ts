import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "boolean", prop: "withOverlay", initial: true, library: true },
    { type: "boolean", prop: "withOverlayInteraction", initial: false, library: false },
    { type: "boolean", prop: "closeOnOverlayClick", initial: false, library: false },
    { type: "boolean", prop: "closeOnEscape", initial: true, library: true },
    { type: "boolean", prop: "withCloseButton", initial: true, library: true }
  ],
  code: `ui.Tour(h, {
  model,
  toParentMessage,
{{props}}  steps
})`
})

const demo = tourDemo("configurator-tour", [
  { target: "configurator-target-1", title: "Step 1", children: ["This is the first step of the tour."] },
  { target: "configurator-target-2", title: "Step 2", children: ["This is the second and final step."] }
])

export const { init, update } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "configurator-target-1", children: ["First target"] }),
          ui.Button(h, { id: "configurator-target-2", variant: "outline", children: ["Second target"] })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Tour(h, { ...demo.tour(model), ...props })
    ]
  })
