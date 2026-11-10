import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const sections = [
  { value: 60, color: "teal" },
  { value: 80, color: "yellow" },
  { value: 100, color: "red" }
]

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { align: "center", gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 3,
    children: [
      titled(h, ui, "Sections", charts.GaugeChart(h, { value: 72, size: 160, sections, target: 65 })),
      titled(
        h,
        ui,
        "Target",
        charts.GaugeChart(h, { value: 72, size: 160, target: 75, sections, roundCaps: true, targetColor: "dark.4" })
      ),
      titled(h, ui, "Half circle", charts.GaugeChart(h, { value: 72, size: 160, startAngle: -90, endAngle: 90 })),
      titled(
        h,
        ui,
        "Label and formatter",
        charts.GaugeChart(h, {
          value: 140,
          size: 160,
          label: "CPU usage",
          valueFormatter: (value) => `${value}%`,
          filledColor: "grape.6",
          trackColor: "grape.1"
        })
      ),
      titled(
        h,
        ui,
        "Thick, round caps",
        charts.GaugeChart(h, { value: 72, size: 160, thickness: 20, roundCaps: true })
      ),
      titled(
        h,
        ui,
        "One round section, labelled by",
        charts.GaugeChart(h, {
          value: 72,
          size: 160,
          roundCaps: true,
          sections: [{ value: 80, color: "teal" }],
          ariaLabelledBy: "gauge-title"
        })
      )
    ]
  })
