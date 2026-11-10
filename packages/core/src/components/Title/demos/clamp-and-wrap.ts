import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 320,
    children: [
      ui.Title(h, {
        order: 3,
        lineClamp: 1,
        children: ["A long heading that does not fit on one line of a narrow card"]
      }),
      ui.Title(h, { order: 4, textWrap: "balance", mt: "md", children: ["A heading balanced over its lines"] })
    ]
  })
