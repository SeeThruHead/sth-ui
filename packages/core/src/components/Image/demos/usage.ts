import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, { maw: 600, children: [ui.Image(h, { radius: "md", src: "images/sailing.svg", alt: "A sailing boat" })] })
