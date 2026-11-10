import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Divider(h, { my: "sm" }),
      ui.Divider(h, { my: "sm", variant: "dashed" }),
      ui.Divider(h, { my: "sm", variant: "dotted" })
    ]
  )
