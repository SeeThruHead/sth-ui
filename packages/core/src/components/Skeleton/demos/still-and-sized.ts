import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const named = (label: string) => ({ attributes: { root: { "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Skeleton(h, { height: 40, width: 120, animate: false, ...named("Still") }),
      ui.Skeleton(h, { height: "3rem", width: "5rem", radius: 0, ...named("Square") })
    ]
  })
