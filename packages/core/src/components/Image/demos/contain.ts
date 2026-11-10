import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Image(h, {
    radius: "md",
    h: 200,
    w: "auto",
    fit: "contain",
    src: "images/forest.svg",
    alt: "A forest at sunset"
  })
