import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Highlight(h, {
    highlight: [
      { text: "error", color: "red" },
      { text: "warning", color: "yellow" },
      { text: "success", color: "green" }
    ],
    children: "Error: Invalid input. Warning: Check this field. Success: All tests passed."
  })
