import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Container(h, { size: "xs", bg: "grape.1", children: ["Size xs"] }),
      ui.Container(h, { size: 400, bg: "teal.1", children: ["Size 400"] }),
      ui.Container(h, { size: "30rem", bg: "orange.1", children: ["Size 30rem"] }),
      ui.Container(h, { fluid: true, size: "xs", bg: "gray.1", children: ["Fluid ignores size"] })
    ]
  })
