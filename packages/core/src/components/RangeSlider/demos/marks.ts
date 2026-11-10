import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("marks", {
  dots: { value: [20, 60], rules: { marks: [{ value: 10 }, { value: 40 }, { value: 95 }] } },
  labelled: {
    value: [20, 60],
    rules: {
      marks: [
        { value: 20, label: "20%" },
        { value: 50, label: "50%" },
        { value: 80, label: "80%" }
      ]
    }
  }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 400,
    gap: 32,
    pb: 32,
    children: [ui.RangeSlider(h, demo.slider(model, "dots")), ui.RangeSlider(h, demo.slider(model, "labelled"))]
  })
