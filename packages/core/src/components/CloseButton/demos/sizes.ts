import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.CloseButton(h, { label: "Close modal" }),
      ...(["xs", "sm", "lg", "xl"] as const).map((size) => ui.CloseButton(h, { size, label: `Close ${size}` })),
      ui.CloseButton(h, { size: 40, iconSize: 14, radius: "xl", variant: "transparent", label: "Close custom" })
    ]
  })
