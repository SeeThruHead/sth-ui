import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    bg: "red.5",
    my: "xl",
    component: "a",
    attributes: { root: { href: "#box" } },
    children: ["My component"]
  })
