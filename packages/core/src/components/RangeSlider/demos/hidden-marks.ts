import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("hidden-marks", {
  range: {
    value: [25, 75],
    rules: {
      minRange: 10,
      restrictToMarks: true,
      marks: [
        { value: 0, label: "0%" },
        { value: 20, hidden: true },
        { value: 40, hidden: true },
        { value: 50, label: "50%" },
        { value: 60, hidden: true },
        { value: 80, hidden: true },
        { value: 100, label: "100%" }
      ]
    }
  }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 400,
    pb: "md",
    children: [
      ui.Text(h, {
        size: "sm",
        mb: "xs",
        children: [
          `Hidden marks allow you to snap to specific values without displaying them visually. Current value: [${demo.slider(model, "range").value.join(", ")}]`
        ]
      }),
      ui.RangeSlider(h, demo.slider(model, "range"))
    ]
  })
