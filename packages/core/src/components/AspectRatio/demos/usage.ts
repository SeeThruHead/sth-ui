import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AspectRatio(h, {
    ratio: 1080 / 720,
    maw: 300,
    mx: "auto",
    w: "100%",
    children: [ui.Image(h, { src: "images/mountains.svg", alt: "Mountains at dawn" })]
  })
