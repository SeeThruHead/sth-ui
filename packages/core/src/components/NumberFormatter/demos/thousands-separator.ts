import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      h.div([], ["With default separator: ", ui.NumberFormatter(h, { thousandSeparator: true, value: 1000000 })]),
      h.div(
        [],
        [
          "With custom separator: ",
          ui.NumberFormatter(h, { thousandSeparator: ".", decimalSeparator: ",", value: 1000000 })
        ]
      ),
      h.div(
        [],
        [
          "Lakh grouping: ",
          ui.NumberFormatter(h, { thousandSeparator: true, thousandsGroupStyle: "lakh", value: 1000000 })
        ]
      ),
      h.div(
        [],
        [
          "Wan grouping: ",
          ui.NumberFormatter(h, { thousandSeparator: true, thousandsGroupStyle: "wan", value: 100000000 })
        ]
      )
    ]
  )
