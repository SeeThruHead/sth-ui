import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const rows = [
  ["Epic name", "7.x migration"],
  ["Status", "Open"],
  ["Total issues", "135"],
  ["Total story points", "874"],
  ["Last updated at", "September 26, 2024 17:41:26"]
] as const

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Table(h, {
    variant: "vertical",
    layout: "fixed",
    withTableBorder: true,
    children: (t) => [
      t.tbody(rows.map(([label, value], index) => t.tr([t.th([label], index === 0 ? { w: 160 } : {}), t.td([value])])))
    ]
  })
