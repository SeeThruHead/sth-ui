import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.RollingNumber(h, { value: -42, previousValue: 7 }),
      ui.RollingNumber(h, { value: 1250000, thousandSeparator: " ", withLiveRegion: true, tabularNumbers: false }),
      ui.RollingNumber(h, { value: -0.001, decimalScale: 2 }),
      ui.RollingNumber(h, { value: 1.5, previousValue: 12.25, decimalScale: 3, decimalSeparator: "," }),
      ui.RollingNumber(h, { value: Number.POSITIVE_INFINITY }),
      ui.RollingNumber(h, { value: 0.12, previousValue: 9 }),
      ui.RollingNumber(h, { value: 10, previousValue: 9 }),
      ui.RollingNumber(h, { value: 15, previousValue: 9 }),
      ui.RollingNumber(h, { value: 7, previousValue: -1.5 })
    ]
  })
