import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Indicator(h, {
        inline: true,
        label: 0,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-1.svg", alt: "Shows zero" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: 0,
        showZero: false,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-2.svg", alt: "Hides zero" })]
      })
    ]
  })
