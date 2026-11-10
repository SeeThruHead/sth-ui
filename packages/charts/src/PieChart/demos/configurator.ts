import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "number", prop: "size", initial: 160, min: 80, max: 300, step: 1 },
    { type: "number", prop: "strokeWidth", initial: 1, library: 1, min: 0, max: 2, step: 0.1 },
    { type: "boolean", prop: "withLabelsLine", initial: true, library: true },
    { type: "select", prop: "labelsType", options: ["value", "percent", "name"], initial: "value", library: "value" }
  ],
  code: `charts.PieChart(h, {
  mx: "auto",
  withLabels: true,
{{props}}  data: [{ name: "USA", value: 400, color: {{color}} }, ...rest]
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html => {
  const { color, ...rest } = props

  return charts.PieChart(h, {
    mx: "auto",
    withLabels: true,
    ...rest,
    data: data.map((cell, index) => (index === 0 ? { ...cell, color } : cell))
  })
}
