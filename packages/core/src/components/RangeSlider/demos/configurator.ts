import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "xl", library: "xl" },
    { type: "boolean", prop: "showLabelOnHover", initial: true, library: true },
    { type: "boolean", prop: "labelAlwaysOn", initial: false, library: false }
  ],
  code: `ui.RangeSlider(h, {
{{props}}  w: "100%",
  maw: 400,
  marks: [
      { value: 20, label: "20%" },
      { value: 50, label: "50%" },
      { value: 80, label: "80%" }
    ]
})`
})

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("usage", { range: { value: [20, 60] } })

export const { init, update, subscriptions } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.RangeSlider(h, {
    ...demo.slider(model, "range"),
    w: "100%",
    maw: 400,
    marks: [
      { value: 20, label: "20%" },
      { value: 50, label: "50%" },
      { value: 80, label: "80%" }
    ],
    ...props
  })
