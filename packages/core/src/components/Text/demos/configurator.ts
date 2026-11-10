import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "gradientFrom", initial: "blue" },
    { type: "color", prop: "gradientTo", initial: "cyan" },
    { type: "number", prop: "gradientDegree", initial: 90, min: 0, max: 360 }
  ],
  code: `ui.Text(h, {
  size: "xl",
  fw: 900,
  variant: "gradient",
  gradient: { from: {{gradientFrom}}, to: {{gradientTo}}, deg: {{gradientDegree}} },
  children: ["Gradient Text"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Text(h, {
    size: "xl",
    fw: 900,
    variant: "gradient",
    gradient: { from: props.gradientFrom, to: props.gradientTo, deg: props.gradientDegree },
    children: ["Gradient Text"]
  })
