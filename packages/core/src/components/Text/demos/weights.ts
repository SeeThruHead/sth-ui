import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Text(h, { fw: 500, children: ["Semibold"] }),
      ui.Text(h, { fs: "italic", children: ["Italic"] }),
      ui.Text(h, { td: "underline", children: ["Underlined"] }),
      ui.Text(h, { c: "dimmed", children: ["Dimmed"] }),
      ui.Text(h, { tt: "uppercase", children: ["Uppercase"] }),
      ui.Text(h, { ta: "center", children: ["Centred"] }),
      ui.Text(h, { size: 26, children: ["Twenty-six pixels"] })
    ]
  })
