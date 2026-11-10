import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Affix(h, { portalTarget: "body", children: [ui.Badge(h, { children: ["Corner"] })] }),
      ui.Affix(h, {
        position: { top: "md", right: "xl" },
        zIndex: 50,
        withinPortal: false,
        children: [ui.Badge(h, { color: "grape", children: ["In place"] })]
      })
    ]
  )
