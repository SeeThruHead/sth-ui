import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ...(["xs", "sm", "md", "lg", "xl"] as const).map((size) => ui.Kbd(h, { size, children: [size] })),
      ui.Kbd(h, { size: 24, children: ["24"] })
    ]
  })
