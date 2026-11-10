import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Text(h, { children: ["Label"] }),
      ui.Divider(h, { orientation: "vertical" }),
      ui.Divider(h, { size: "sm", orientation: "vertical" }),
      ui.Divider(h, { size: "md", orientation: "vertical" }),
      ui.Divider(h, { size: "lg", orientation: "vertical" }),
      ui.Divider(h, { size: "xl", orientation: "vertical" }),
      ui.Text(h, { children: ["Label"] }),
      ui.Divider(h, { size: "0.5rem", color: "grape", orientation: "vertical" })
    ]
  })
