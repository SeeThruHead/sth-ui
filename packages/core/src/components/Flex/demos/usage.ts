import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Flex(h, {
    mih: 50,
    bg: "rgba(0, 0, 0, .3)",
    gap: "md",
    justify: "flex-start",
    align: "flex-start",
    direction: "row",
    wrap: "wrap",
    children: ["Button 1", "Button 2", "Button 3"].map((label) => ui.Button(h, { children: [label] }))
  })
