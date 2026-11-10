import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Progress(h, { value: 80, orientation: "vertical", h: 200 }),
      ui.Progress(h, { value: 60, color: "orange", size: "xl", orientation: "vertical", h: 200, animated: true }),
      ui.ProgressRoot(h, {
        size: "xl",
        autoContrast: true,
        orientation: "vertical",
        h: 200,
        sections: [
          { value: 40, color: "lime.4", label: "Documents" },
          { value: 20, color: "yellow.4", label: "Apps" },
          { value: 20, color: "cyan.7", label: "Other" }
        ]
      })
    ]
  })
