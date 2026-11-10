import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ display: "flex" })],
    [
      ui.AspectRatio(h, {
        ratio: 1,
        flex: "0 0 100px",
        children: [ui.Image(h, { src: "images/avatar-1.svg", alt: "Avatar" })]
      })
    ]
  )
