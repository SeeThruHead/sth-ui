import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ display: "flex", gap: "24px", alignItems: "center" })],
    [
      ui.Loader(h, { label: "Oval" }),
      ui.Loader(h, { type: "bars", label: "Bars" }),
      ui.Loader(h, { type: "dots", label: "Dots" })
    ]
  )
