import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { palette } from "../../../theme/palette.stylex.ts"
import { breakout } from "../Container.ts"
import type { Ui } from "../../../Ui.ts"

const band = stylex.create({ row: { backgroundColor: palette.indigo3 } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Container(h, {
    strategy: "grid",
    size: 500,
    children: [
      ui.Box(h, { bg: "indigo.1", p: "xs", children: ["Main content, 500px wide"] }),
      breakout([ui.Box(h, { p: "xs", children: ["Breakout row, full width; its content lines up"] })], {
        row: band.row
      })
    ]
  })
