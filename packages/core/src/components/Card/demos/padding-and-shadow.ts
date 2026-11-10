import type { Html, HtmlBuilder } from "foldkit/html"
import { cardSection } from "../Card.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Card(h, {
    padding: "xl",
    radius: 0,
    shadow: "md",
    w: "100%",
    maw: 320,
    attributes: { root: { "aria-label": "Plain card" } },
    children: [
      cardSection({ children: [ui.Image(h, { src: "images/sailing.svg", h: 120, alt: "Edge to edge" })] }),
      ui.Text(h, { mt: "md", children: ["Content keeps the xl padding"] })
    ]
  })
