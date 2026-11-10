import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Input(h, {
    component: "button",
    pointer: true,
    w: "100%",
    maw: 340,
    children: [ui.InputPlaceholder(h, { children: ["Placeholder content"] })]
  })
