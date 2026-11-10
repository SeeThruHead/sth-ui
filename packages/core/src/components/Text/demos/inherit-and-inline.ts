import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    fz: 24,
    fw: 700,
    children: [
      ui.Text(h, { inherit: true, children: ["Inherits 24px bold"] }),
      ui.Text(h, { span: true, inline: true, children: ["Inline span"] }),
      ui.Text(h, { component: "label", textWrap: "balance", children: ["A label, balanced"] })
    ]
  })
