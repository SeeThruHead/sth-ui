import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  { name: "Completed", value: 68, color: "teal.6" },
  { name: "In progress", value: 22, color: "yellow.6" },
  { name: "Failed", value: 10, color: "red.6" }
]

export const view = <M>(h: HtmlBuilder<M>): Html => charts.WaffleChart(h, { data })
