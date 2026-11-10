import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const data = [
  { day: "Mon", row: 1, sales: 12 },
  { day: "Tue", row: 1, sales: null },
  { day: "Wed", row: null, sales: 30 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.BubbleChart(h, {
    h: 80,
    data,
    range: [36, 400],
    dataKey: { x: "day", y: "row", z: "sales" },
    valueFormatter: (value) => `$${value}`,
    textColor: "blue.7",
    gridColor: "gray.5",
    withTooltip: false
  })
