import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ProgressRoot(h, {
    size: "xl",
    w: "100%",
    maw: 520,
    sections: [
      { value: 35, color: "cyan", label: "Documents" },
      { value: 28, color: "pink", label: "Photos" },
      { value: 15, color: "orange", label: "Other" }
    ]
  })
