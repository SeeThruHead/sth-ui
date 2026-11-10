import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const colored = [
  { name: "Approved", value: 64, color: "teal", variant: "filled" as const },
  { name: "Pending", value: 28, color: "yellow", variant: "filled" as const },
  { name: "Rejected", value: 8, color: "#ff6b6b", textColor: "dark.9" }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    maw: 500,
    mx: "auto",
    children: [
      charts.BarsList(h, {
        data: colored,
        barGap: "md",
        barHeight: 24,
        minBarSize: "5rem",
        autoContrast: true,
        valueLabel: "Count"
      }),
      charts.BarsList(h, {
        data: colored.slice(0, 2).map((item) => ({ name: item.name, value: item.value })),
        barColor: "grape",
        variant: "filled",
        barTextColor: "yellow.2",
        barsLabel: "Status",
        renderBar: (item, bar) => h.div([h.Attribute("title", `${item.name}: ${item.value}%`)], [bar])
      }),
      charts.BarsList(h, { data: [{ name: "Nothing yet", value: 0, variant: "light", textColor: "red" }] })
    ]
  })
