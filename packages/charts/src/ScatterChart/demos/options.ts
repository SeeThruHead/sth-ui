import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const data = [
  {
    color: "blue.5",
    name: "Group 1",
    data: [
      { age: 25, weight: 62, name: "Ann" },
      { age: 32, weight: 70 },
      { age: 41, weight: null }
    ]
  },
  {
    color: "red.5",
    name: "Group 2",
    data: [
      { age: 29, weight: 81 },
      { age: 37, weight: 76 },
      { age: 45, weight: 88 }
    ]
  }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.ScatterChart(h, {
    h: 300,
    data,
    dataKey: { x: "age", y: "weight" },
    unit: { y: " kg" },
    labels: { x: "Age", y: "Weight" },
    valueFormatter: { x: (value) => `${value} y` },
    withLegend: true
  })
