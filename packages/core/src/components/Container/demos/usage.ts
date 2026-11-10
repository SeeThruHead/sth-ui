import type { Html, HtmlBuilder } from "foldkit/html"
import { blueLight } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    children: [
      ui.Container(h, { bg: blueLight, h: 50, mt: "md", children: ["Default Container"] }),
      ui.Container(h, { size: "xs", bg: blueLight, h: 50, mt: "md", children: ["xs Container"] }),
      ui.Container(h, {
        px: 0,
        size: 480,
        bg: blueLight,
        h: 50,
        mt: "md",
        children: ["480px Container without padding"]
      })
    ]
  })
