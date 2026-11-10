import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("min-range", { range: { value: [30, 60], rules: { minRange: 20 } } })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 400,
    children: [
      ui.Text(h, { size: "sm", mb: "xs", children: ["Minimum range: 20 (thumbs must be at least 20 units apart)"] }),
      ui.RangeSlider(h, demo.slider(model, "range")),
      ui.Text(h, {
        size: "sm",
        mt: "xs",
        children: [
          `Value: [${demo.slider(model, "range").value.join(", ")}] - Range: ${demo.slider(model, "range").value[1] - demo.slider(model, "range").value[0]}`
        ]
      })
    ]
  })
