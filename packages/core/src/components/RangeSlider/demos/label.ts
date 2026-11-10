import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("label", {
  none: { value: [20, 60] },
  formatted: { value: [20, 60] },
  always: { value: [20, 60] }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 400,
    gap: 0,
    children: [
      ui.Text(h, { size: "sm", children: ["No label"] }),
      ui.RangeSlider(h, { ...demo.slider(model, "none"), label: null }),
      ui.Text(h, { size: "sm", mt: "xl", children: ["Formatted label"] }),
      ui.RangeSlider(h, { ...demo.slider(model, "formatted"), label: (value) => `${value} °C` }),
      ui.Text(h, { size: "sm", mt: "xl", children: ["Label always visible"] }),
      ui.RangeSlider(h, { ...demo.slider(model, "always"), labelAlwaysOn: true, mt: 36 })
    ]
  })
