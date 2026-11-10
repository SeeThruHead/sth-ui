import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.SemiCircleProgress(h, { value: 30, label: "Bottom", mb: "xl" }),
      ui.SemiCircleProgress(h, { value: 30, label: "Center", labelPosition: "center" })
    ]
  )
