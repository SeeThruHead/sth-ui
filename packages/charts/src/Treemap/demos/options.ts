import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const flat = [
  { name: "Rent", value: 1200, color: "yellow.2" },
  { name: "Food", value: 600, color: "indigo.9" },
  { name: "Travel", value: 300 },
  { name: "Fun", value: 150 },
  { name: "Tiny", value: 2 }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      charts.Treemap(h, {
        data: flat,
        height: 200,
        autoContrast: true,
        strokeWidth: 3,
        strokeColor: "dark.6",
        valueFormatter: (value) => `$${value}`
      }),
      charts.Treemap(h, { data: flat, height: 160, textColor: "dark.9", withTooltip: false, aspectRatio: 1 })
    ]
  })
