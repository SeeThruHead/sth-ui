import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("domain", {
  range: {
    min: 10,
    max: 90,
    value: [25, 75],
    rules: {
      domain: [0, 100],
      marks: [
        { value: 10, label: "min" },
        { value: 90, label: "max" }
      ]
    }
  }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.RangeSlider(h, { ...demo.slider(model, "range"), w: "100%", maw: 400, mb: 40 })
