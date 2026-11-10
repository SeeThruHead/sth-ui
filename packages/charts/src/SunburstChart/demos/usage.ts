import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  {
    name: "Fruits",
    color: "red.6",
    children: [
      { name: "Apples", value: 30, color: "red.4" },
      { name: "Pears", value: 10 }
    ]
  },
  {
    name: "Vegetables",
    color: "green.6",
    children: [
      { name: "Carrots", value: 20 },
      {
        name: "Peas",
        color: "teal.6",
        children: [
          { name: "Garden", value: 15 },
          { name: "Snow", value: 5 }
        ]
      }
    ]
  }
]

export const view = <M>(h: HtmlBuilder<M>): Html => charts.SunburstChart(h, { data, mx: "auto" })
