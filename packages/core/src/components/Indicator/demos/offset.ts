import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Indicator(h, {
    inline: true,
    size: 16,
    offset: 7,
    position: "bottom-end",
    color: "red",
    withBorder: true,
    children: [ui.Avatar(h, { size: "lg", radius: "xl", src: "images/avatar-3.svg", alt: "Avatar 3" })]
  })
