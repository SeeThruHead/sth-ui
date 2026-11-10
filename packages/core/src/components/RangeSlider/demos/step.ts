import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("step", {
  decimal: { min: -10, max: 10, step: 0.1, value: [0, 10], rules: { minRange: 2 } },
  marks: { step: 25, value: [50, 75], rules: { marks: [0, 25, 50, 75, 100].map((value) => ({ value })) } }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 400,
    gap: 0,
    children: [
      ui.Text(h, { children: ["Decimal step"] }),
      ui.RangeSlider(h, demo.slider(model, "decimal")),
      ui.Text(h, { mt: "md", children: ["Step matched with marks"] }),
      ui.RangeSlider(h, demo.slider(model, "marks"))
    ]
  })
