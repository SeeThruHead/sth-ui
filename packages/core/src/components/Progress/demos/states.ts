import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Progress(h, { value: 70, size: 20, striped: true, withAria: false, color: "grape", w: 300 })
