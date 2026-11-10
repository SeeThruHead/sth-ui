import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const ranges = [
  { value: 150, color: "red.2" },
  { value: 225, color: "yellow.2" },
  { value: 300, color: "green.2" }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.BulletChart(h, { value: 270, target: 250, ranges, label: "Revenue", barColor: "dark.6" })
