import type { Html, HtmlBuilder } from "foldkit/html"
import { ArrowUpIcon } from "@sth-ui/icons/icons/ArrowUpIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Text(h, { ta: "center", children: ["Affix is located at the bottom of the screen"] }),
      ui.Affix(h, {
        position: { bottom: 20, left: 20 },
        children: [ui.Button(h, { leftSection: ArrowUpIcon(h, { size: 16 }), children: ["Scroll to top"] })]
      })
    ]
  )
