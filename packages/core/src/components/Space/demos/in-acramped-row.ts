import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    gap: 0,
    wrap: "nowrap",
    w: 220,
    children: [
      ui.Text(h, { span: true, children: ["A long left label"] }),
      ui.Space(h, { w: "xl" }),
      ui.Text(h, { span: true, children: ["A long right label"] }),
      ui.Space(h, { w: 24, miw: 8 }),
      ui.Text(h, { span: true, children: ["End"] })
    ]
  })
