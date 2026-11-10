import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    align: "stretch",
    children: [
      ui.Paper(h, { withBorder: true, p: "md", children: ["With border"] }),
      ui.Paper(h, { radius: "xl", shadow: "md", p: "md", children: ["Radius xl, shadow md"] }),
      ui.Paper(h, { radius: 0, shadow: "0 0 0 3px rgb(255, 0, 0)", p: "md", children: ["Square, custom shadow"] }),
      ui.Paper(h, { component: "section", radius: "4px", p: "md", children: ["A section"] })
    ]
  })
