import type { Html, HtmlBuilder } from "foldkit/html"
import { accent } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.Code(h, { color: "blue.9", c: "white", children: ["React.createElement()"] }),
      ui.Code(h, { color: accent.light, children: ["React.createElement()"] })
    ]
  })
