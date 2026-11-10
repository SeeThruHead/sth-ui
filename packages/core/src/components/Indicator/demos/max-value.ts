import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Indicator(h, {
        inline: true,
        label: 50,
        maxValue: 99,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-1.svg", alt: "Fifty" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: 100,
        maxValue: 99,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-2.svg", alt: "Hundred" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: 1000,
        maxValue: 999,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-3.svg", alt: "Thousand" })]
      })
    ]
  })
