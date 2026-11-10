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
    { type: "select", prop: "tickLine", options: ["x", "y", "xy", "none"], initial: "y", library: "y" },
    { type: "select", prop: "gridAxis", options: ["x", "y", "xy", "none"], initial: "x", library: "x" },
    { type: "boolean", prop: "withXAxis", initial: true, library: true },
    { type: "boolean", prop: "withYAxis", initial: true, library: true },
    { type: "boolean", prop: "withDots", initial: true, library: true }
  ],
  code: `charts.CompositeChart(h, {
{{props}}  h: 300,
  data,
  dataKey: "date",
  maxBarWidth: 30,
  series: [
      { name: "Tomatoes", color: "rgba(18, 120, 255, 0.2)", type: "bar" },
      { name: "Apples", color: "red.8", type: "line" },
      { name: "Oranges", color: "yellow.8", type: "area" }
    ]
})`
})

export const data = [
  { date: "Mar 22", Apples: 2890, Oranges: 2338, Tomatoes: 2452 },
  { date: "Mar 23", Apples: 2756, Oranges: 2103, Tomatoes: 2402 },
  { date: "Mar 24", Apples: 3322, Oranges: 986, Tomatoes: 1821 },
  { date: "Mar 25", Apples: 3470, Oranges: 2108, Tomatoes: 2809 },
  { date: "Mar 26", Apples: 3129, Oranges: 1726, Tomatoes: 2290 }
]

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.CompositeChart(h, {
    h: 300,
    data,
    dataKey: "date",
    maxBarWidth: 30,
    series: [
      { name: "Tomatoes", color: "rgba(18, 120, 255, 0.2)", type: "bar" },
      { name: "Apples", color: "red.8", type: "line" },
      { name: "Oranges", color: "yellow.8", type: "area" }
    ],
    ...props
  })
