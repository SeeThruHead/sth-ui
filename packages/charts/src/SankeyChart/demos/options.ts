import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const budget = {
  nodes: [
    { name: "Salary", color: "teal.6" },
    { name: "Side job", color: "grape.6" },
    { name: "Budget" },
    { name: "Rent" },
    { name: "Food" },
    { name: "Savings" }
  ],
  links: [
    { source: 0, target: 2, value: 4000 },
    { source: 1, target: 2, value: 800 },
    { source: 2, target: 3, value: 1800 },
    { source: 2, target: 4, value: 900 },
    { source: 2, target: 5, value: 2100 }
  ]
}

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      charts.SankeyChart(h, {
        data: budget,
        height: 260,
        nodeWidth: 16,
        nodePadding: 20,
        linkCurvature: 0.3,
        linkOpacity: 0.6,
        colors: ["orange.6", "indigo.6"],
        linkColor: "blue.2",
        textColor: "dimmed",
        valueFormatter: (value) => `$${value}`
      }),
      charts.SankeyChart(h, { data: budget, height: 180, nodeColor: "gray.6", withTooltip: false })
    ]
  })
