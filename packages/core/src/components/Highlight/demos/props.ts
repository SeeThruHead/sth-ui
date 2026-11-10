import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Highlight(h, {
    component: "a",
    attributes: { root: { href: "https://mantine.dev", target: "_blank" } },
    highlight: "mantine",
    fw: 500,
    c: "anchor",
    children: "Mantine website"
  })
