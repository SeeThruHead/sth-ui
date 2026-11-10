import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Text(h, { children: ["Highlight ", ui.Mark(h, { children: ["this chunk"] }), " of the text"] })
