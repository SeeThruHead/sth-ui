import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("restrict-to-marks", {
  range: {
    value: [5, 15],
    rules: { restrictToMarks: true, marks: [5, 15, 25, 35, 70, 80, 90].map((value) => ({ value })) }
  }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.RangeSlider(h, { ...demo.slider(model, "range"), w: "100%", maw: 400 })
