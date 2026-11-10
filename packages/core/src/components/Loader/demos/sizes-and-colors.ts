import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ display: "flex", gap: "24px", alignItems: "center" })],
    [
      ui.Loader(h, { size: "xs", label: "Extra small" }),
      ui.Loader(h, { size: "xl", color: "red", label: "Extra large red" }),
      ui.Loader(h, { size: 50, color: "#12b886", type: "dots", label: "Fifty pixels" })
    ]
  )
