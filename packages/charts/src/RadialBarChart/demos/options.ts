import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

const goals = [
  { name: "Steps", value: 7200, color: "teal.6" },
  { name: "Sleep", value: null, color: "indigo.6" },
  { name: "Water", value: 5000, color: "blue.5" }
]

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    children: [
      titled(
        h,
        ui,
        "Half circle, labels, thin bars",
        charts.RadialBarChart(h, {
          data,
          dataKey: "value",
          h: 220,
          startAngle: 180,
          endAngle: 0,
          withLabels: true,
          barSize: 10
        })
      ),
      titled(
        h,
        ui,
        "No background, no tooltip, missing value",
        charts.RadialBarChart(h, {
          data: goals,
          dataKey: "value",
          h: 220,
          withBackground: false,
          withTooltip: false,
          emptyBackgroundColor: "red.1"
        })
      )
    ]
  })
