import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div([], [ui.FloatingIndicator(h, { anchor: "nothing", target: false, transitionDuration: "0.4s" })])
