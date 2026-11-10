import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const data = [
  { name: "USA", value: 400, color: "indigo.6" },
  { name: "India", value: 300, color: "yellow.6" },
  { name: "Japan", value: 100, color: "teal.6" },
  { name: "Other", value: 200, color: "gray.6" }
]

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "number", prop: "size", initial: 160, min: 80, max: 300, step: 1 },
    { type: "number", prop: "strokeWidth", initial: 1, library: 1, min: 0, max: 5, step: 0.1 },
    { type: "select", prop: "labelsPosition", options: ["left", "inside", "right"], initial: "right", library: "right" }
  ],
  code: `charts.FunnelChart(h, {
  mx: "auto",
  withLabels: true,
{{props}}  data: [{ name: "USA", value: 400, color: {{color}} }, ...rest]
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html => {
  const { color, ...rest } = props

  return charts.FunnelChart(h, {
    mx: "auto",
    withLabels: true,
    ...rest,
    data: data.map((cell, index) => (index === 0 ? { ...cell, color } : cell))
  })
}
