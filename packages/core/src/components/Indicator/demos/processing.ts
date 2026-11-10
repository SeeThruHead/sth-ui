import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Indicator(h, {
    inline: true,
    processing: true,
    color: "red",
    size: 12,
    children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-4.svg", alt: "Avatar 4" })]
  })
