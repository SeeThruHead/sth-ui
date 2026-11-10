import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.RingProgress(h, {
    label: ui.Text(h, { size: "xs", ta: "center", children: ["Application data usage"] }),
    sections: [
      { value: 40, color: "cyan" },
      { value: 15, color: "orange" },
      { value: 15, color: "grape" }
    ]
  })
