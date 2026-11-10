import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data, series } from "./data.ts"

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
    { type: "select", prop: "tickLine", options: ["x", "y", "xy", "none"], initial: "y", library: "y" },
    { type: "select", prop: "gridAxis", options: ["x", "y", "xy", "none"], initial: "x", library: "x" },
    { type: "boolean", prop: "withGradient", initial: true, library: true },
    { type: "boolean", prop: "withXAxis", initial: true, library: true },
    { type: "boolean", prop: "withYAxis", initial: true, library: true },
    { type: "boolean", prop: "withDots", initial: true, library: true }
  ],
  code: `charts.AreaChart(h, {
{{props}}  h: 300,
  data,
  dataKey: "date",
  series
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.AreaChart(h, { h: 300, data, dataKey: "date", series, ...props })
