import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

const plain = [
  {
    name: "Mon",
    children: [
      { name: "AM", value: 3 },
      { name: "PM", value: 5 }
    ]
  },
  { name: "Tue", value: 4 }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      charts.SunburstChart(h, {
        data,
        size: 240,
        innerRadius: 0,
        gap: 2,
        strokeColor: "dark.6",
        withLabels: true,
        withTooltip: false
      }),
      charts.SunburstChart(h, {
        data: plain,
        size: 240,
        startAngle: 180,
        endAngle: 0,
        valueFormatter: (value) => `${value} h`
      })
    ]
  })
