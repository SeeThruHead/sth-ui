import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Badge(h, { component: "a", attributes: { root: { href: "#releases" } }, children: ["v2.0"] })
