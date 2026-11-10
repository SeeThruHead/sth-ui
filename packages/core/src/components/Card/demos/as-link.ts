import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Card(h, {
    component: "a",
    withBorder: true,
    w: "100%",
    maw: 320,
    attributes: { root: { href: "#article" } },
    children: [ui.Text(h, { fw: 500, children: ["You've won a million dollars in cash!"] })]
  })
