import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    id: "responsive",
    p: { base: "xs", sm: "xl" },
    fz: { md: 30 },
    c: { base: "blue", lg: "red" },
    children: ["Padding xs on phones, xl from sm up"]
  })
