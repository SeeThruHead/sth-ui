import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Badge(h, { color: "teal", variant: "light", children: ["Teal"] }),
      ui.Badge(h, { color: "red.7", children: ["Red 7"] }),
      ui.Badge(h, { color: "#7048e8", variant: "outline", children: ["Custom"] }),
      ui.Badge(h, { radius: "sm", children: ["Square-ish"] })
    ]
  })
