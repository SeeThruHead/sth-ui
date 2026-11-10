import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [
      ui.Text(h, {
        children: ["A ", ui.Mark(h, { color: "teal", children: ["theme colour"] }), " uses shade 2, or 5 in dark mode"]
      }),
      ui.Text(h, { children: ["An ", ui.Mark(h, { color: "red.4", children: ["exact shade"] }), " stays as it is"] }),
      ui.Text(h, { children: ["Any ", ui.Mark(h, { color: "#d0bfff", children: ["CSS colour"] }), " works too"] })
    ]
  })
