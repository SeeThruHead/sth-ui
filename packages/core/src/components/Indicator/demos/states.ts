import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    gap: "xl",
    children: [
      ui.Indicator(h, {
        inline: true,
        label: "",
        offset: { x: 3, y: 6 },
        children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-1.svg", alt: "Empty label" })]
      }),
      ui.Box(h, { w: 40, h: 40, children: [ui.Indicator(h, { label: "Alone" })] }),
      ui.Indicator(h, {
        inline: true,
        label: "0",
        showZero: false,
        children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-2.svg", alt: "Text zero" })]
      })
    ]
  })
