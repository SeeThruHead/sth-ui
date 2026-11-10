import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Indicator(h, {
    inline: true,
    label: "New",
    size: 16,
    children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-2.svg", alt: "Avatar 2" })]
  })
