import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "fillDirection", options: ["right-to-left", "left-to-right"], initial: "left-to-right" },
    { type: "select", prop: "orientation", options: ["up", "down"], initial: "up" },
    { type: "color", prop: "filledSegmentColor", initial: "blue" },
    { type: "number", prop: "size", initial: 200, min: 120, max: 450 },
    { type: "number", prop: "thickness", initial: 12, min: 1, max: 20 },
    { type: "number", prop: "value", initial: 40, min: 0, max: 100 }
  ],
  code: `ui.SemiCircleProgress(h, {
{{props}}  label: "Label",
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.SemiCircleProgress(h, { ...props, label: "Label" })
