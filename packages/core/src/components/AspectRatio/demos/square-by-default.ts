import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    children: [
      ui.AspectRatio(h, { w: 160, children: [ui.Paper(h, { withBorder: true, children: ["Square"] })] }),
      ui.AspectRatio(h, {
        ratio: 1 / 2,
        w: 120,
        children: [ui.Paper(h, { withBorder: true, children: ["Tall, 1 by 2"] })]
      })
    ]
  })
