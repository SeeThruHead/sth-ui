import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = {
  nodes: [
    { name: "Coal" },
    { name: "Gas" },
    { name: "Solar" },
    { name: "Wind" },
    { name: "Grid" },
    { name: "Homes" },
    { name: "Industry" },
    { name: "Loss" }
  ],
  links: [
    { source: 0, target: 4, value: 40 },
    { source: 1, target: 4, value: 30 },
    { source: 2, target: 5, value: 10 },
    { source: 3, target: 4, value: 2 },
    { source: 4, target: 5, value: 37 },
    { source: 4, target: 6, value: 25 },
    { source: 4, target: 7, value: 10 },
    { source: 2, target: 6, value: 5 }
  ]
}

export const view = <M>(h: HtmlBuilder<M>): Html => charts.SankeyChart(h, { data })
