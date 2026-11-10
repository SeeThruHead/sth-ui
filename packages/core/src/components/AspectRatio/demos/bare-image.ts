import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AspectRatio(h, {
    ratio: 16 / 9,
    maw: 320,
    pos: "relative",
    children: [
      h.img([h.Src("images/mountains.svg"), h.Alt("Bare mountains")]),
      ui.Overlay(h, { color: "#000", backgroundOpacity: 0.35, attributes: { root: { "data-testid": "overlay" } } })
    ]
  })
