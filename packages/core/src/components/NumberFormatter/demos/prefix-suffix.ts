import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      h.div([], ["With prefix: ", ui.NumberFormatter(h, { prefix: "$ ", value: 100 })]),
      h.div([], ["With suffix: ", ui.NumberFormatter(h, { value: 100, suffix: " RUB" })])
    ]
  )
