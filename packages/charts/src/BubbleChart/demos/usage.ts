import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  { hour: "08:00", index: 150, value: 150 },
  { hour: "10:00", index: 166, value: 170 },
  { hour: "12:00", index: 170, value: 190 },
  { hour: "14:00", index: 150, value: 210 },
  { hour: "16:00", index: 150, value: 200 },
  { hour: "18:00", index: 150, value: 180 },
  { hour: "20:00", index: 150, value: 140 },
  { hour: "22:00", index: 150, value: 160 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.BubbleChart(h, {
    h: 60,
    data,
    range: [16, 225],
    label: "Sales/hour",
    color: "lime.6",
    dataKey: { x: "hour", y: "index", z: "value" }
  })
