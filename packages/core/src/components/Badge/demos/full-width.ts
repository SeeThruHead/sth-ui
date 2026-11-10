import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, { maw: 400, children: [ui.Badge(h, { fullWidth: true, children: ["Full width badge"] })] })
