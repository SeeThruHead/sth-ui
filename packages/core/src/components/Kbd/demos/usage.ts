import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [ui.Kbd(h, { children: ["⌘"] }), " + ", ui.Kbd(h, { children: ["Shift"] }), " + ", ui.Kbd(h, { children: ["M"] })]
  )
