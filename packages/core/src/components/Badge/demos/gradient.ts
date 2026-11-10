import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Badge(h, {
    size: "xl",
    variant: "gradient",
    gradient: { from: "blue", to: "cyan", deg: 90 },
    children: ["Gradient badge"]
  })
