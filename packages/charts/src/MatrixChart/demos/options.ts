import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

const sparse = [
  { x: "Q1", y: "North", value: 12 },
  { x: "Q2", y: "North", value: null },
  { x: "Q1", y: "South", value: 30 }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      charts.MatrixChart(h, {
        data: [...data, { x: "Sun", y: "20:00", value: null }],
        withXLabels: true,
        withYLabels: true,
        withLegend: true,
        withTooltip: true,
        getTooltipLabel: (cell) => `${cell.x} ${cell.y}: ${cell.value ?? "no data"}`
      }),
      charts.MatrixChart(h, {
        data: sparse,
        xLabels: ["Q1", "Q2", "Q3"],
        withXLabels: true,
        xLabelsPosition: "top",
        xLabelsRotation: 0,
        xLabelsHeight: 24,
        withLegend: true,
        emptyColor: "gray.4",
        colors: ["blue.2", "blue.5", "blue.8"],
        domain: [0, 40],
        cellSize: 28,
        gap: 3,
        cellRadius: 14,
        ariaLabel: "Sales by region"
      }),
      charts.MatrixChart(h, { data: [] })
    ]
  })
