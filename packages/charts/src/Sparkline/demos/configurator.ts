import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

import type { Ui } from "@sth-ui/core/Ui.ts"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "curveType",
      options: ["bump", "linear", "natural", "monotone", "step", "stepBefore", "stepAfter"],
      initial: "linear"
    },
    { type: "color", prop: "color", initial: "blue" },
    { type: "number", prop: "fillOpacity", initial: 0.6, min: 0, max: 1, step: 0.01 },
    { type: "boolean", prop: "withGradient", initial: true, library: true },
    { type: "number", prop: "strokeWidth", initial: 2, min: 0.5, max: 5, step: 0.1 }
  ],
  code: `charts.Sparkline(h, {
{{props}}  w: 200,
  h: 60,
  data: [10, 20, 40, 20, 40, 10, 50]
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.Sparkline(h, { w: 200, h: 60, data: [10, 20, 40, 20, 40, 10, 50], ...props })
