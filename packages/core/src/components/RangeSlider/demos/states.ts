import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { sliderDemo } from "./sliders.ts"
import type { Message, Model } from "./sliders.ts"

export { Message, Model } from "./sliders.ts"

const demo = sliderDemo("states", {
  vertical: { value: [20, 70], rules: { orientation: "vertical" } },
  inverse: {
    value: [30, 70],
    rules: { orientation: "vertical", marks: [{ value: 10, label: "Ten" }, { value: 50 }, { value: 90 }] }
  },
  named: { value: [10, 40] },
  ended: { value: [30, 50] }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    gap: "xl",
    children: [
      ui.RangeSlider(h, {
        ...demo.slider(model, "vertical"),
        thumbFromLabel: "Lowest",
        thumbToLabel: "Highest",
        labelAlwaysOn: true
      }),
      ui.RangeSlider(h, { ...demo.slider(model, "inverse"), thumbLabel: "Inverse", inverted: true, disabled: true }),
      ui.Stack(h, {
        w: 280,
        gap: "xl",
        children: [
          ui.RangeSlider(h, {
            ...demo.slider(model, "named"),
            name: "price",
            size: 6,
            thumbSize: 20,
            color: "grape",
            radius: "xs",
            scale: (value) => value * 10,
            thumbLabel: "Price",
            thumbValueText: (value) => `${value} dollars`,
            thumbChildren: ["A", "B"],
            showLabelOnHover: false
          }),
          ui.RangeSlider(h, { ...demo.slider(model, "ended"), thumbLabel: "Ends", thumbChildren: "•", size: "xl" }),
          ui.Text(h, {
            size: "sm",
            children: [`Ended at ${model.sliders["ended"]?.ended?.join(", ") ?? "nothing yet"}`]
          })
        ]
      })
    ]
  })
