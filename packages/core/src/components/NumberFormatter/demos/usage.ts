import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.NumberFormatter(h, { prefix: "$ ", value: 1000000, thousandSeparator: true })
