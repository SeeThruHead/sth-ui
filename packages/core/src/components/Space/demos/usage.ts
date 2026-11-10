import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Text(h, { children: ["First line"] }),
      ui.Space(h, { h: "md" }),
      ui.Text(h, { children: ["Second line, 16px further down"] }),
      ui.Space(h, { h: 40, mih: 12 }),
      ui.Text(h, { children: ["Third line, 40px further down"] })
    ]
  })
