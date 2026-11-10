import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const data = [
  { product: "Apples", unitsSold: 2214411234 },
  { product: "Oranges", unitsSold: 9983812411 },
  { product: "Bananas", unitsSold: 1234567890 },
  { product: "Pineapples", unitsSold: 9948810000 },
  { product: "Pears", unitsSold: 9933771111 }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Table(h, {
    tabularNums: true,
    children: (t) => [
      t.thead([t.tr([t.th(["Product"]), t.th(["Units sold"])])]),
      t.tbody(
        data.map((item) =>
          t.tr([
            t.td([item.product]),
            t.td([ui.NumberFormatter(h, { value: item.unitsSold, thousandSeparator: true })])
          ])
        )
      )
    ]
  })
