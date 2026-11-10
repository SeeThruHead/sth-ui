import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Title(h, { children: ["No order is h1"] }),
      ui.Title(h, { order: 3, size: "h1", children: ["h3 the size of h1"] }),
      ui.Title(h, { order: 1, size: "xs", children: ["h1 at size xs"] }),
      ui.Title(h, { order: 2, size: 40, c: "grape", children: ["h2 at 40 pixels"] }),
      ui.Title(h, { order: 4, size: "1.5rem", children: ["h4 at 1.5rem"] })
    ]
  })
