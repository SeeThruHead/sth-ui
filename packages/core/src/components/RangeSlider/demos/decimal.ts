import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("decimal", {
  range: { min: 0, max: 1, step: 0.0005, value: [0.2, 0.8], rules: { minRange: 0.2 } }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.RangeSlider(h, { ...demo.slider(model, "range"), w: "100%", maw: 400 })
