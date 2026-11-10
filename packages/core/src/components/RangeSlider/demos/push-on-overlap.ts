import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("push-on-overlap", {
  range: { value: [25, 65], rules: { pushOnOverlap: false, minRange: 20 } }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.RangeSlider(h, { ...demo.slider(model, "range"), w: "100%", maw: 400 })
