import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

const styles = stylex.create({
  gradient: {
    backgroundImage: `linear-gradient(45deg, ${palette.cyan5}, ${palette.indigo5})`,
    fontWeight: 700,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  }
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Highlight(h, {
    ta: "center",
    highlight: ["highlighted", "default"],
    highlightStyles: [styles.gradient],
    children: "You can change styles of highlighted part if you do not like default styles"
  })
