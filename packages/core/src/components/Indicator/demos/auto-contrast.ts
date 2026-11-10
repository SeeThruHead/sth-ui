import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Indicator(h, {
        inline: true,
        label: "99",
        color: "lime.4",
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-1.svg", alt: "Lime" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: "99",
        color: "lime.4",
        autoContrast: true,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-2.svg", alt: "Lime with contrast" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: "99",
        color: "cyan.9",
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-3.svg", alt: "Cyan" })]
      }),
      ui.Indicator(h, {
        inline: true,
        label: "99",
        color: "cyan.9",
        autoContrast: true,
        children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-4.svg", alt: "Cyan with contrast" })]
      })
    ]
  })
