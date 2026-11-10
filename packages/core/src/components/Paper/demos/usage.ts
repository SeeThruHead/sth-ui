import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Paper(h, {
    shadow: "xs",
    p: "xl",
    maw: 340,
    children: [
      ui.Text(h, { children: ["Paper is the most basic ui component"] }),
      ui.Text(h, {
        children: ["Use it to create cards, dropdowns, modals and other components that require background with shadow"]
      })
    ]
  })
