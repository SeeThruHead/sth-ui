import type { Html, HtmlBuilder } from "foldkit/html"
import * as NavigationProgress from "../NavigationProgress.ts"
import type { Ui } from "../../../Ui.ts"

const model = NavigationProgress.update(NavigationProgress.init(), NavigationProgress.Message.Set({ value: 60 })).model

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ position: "relative", height: "40px" })],
    [ui.NavigationProgress(h, { model, color: "grape", size: 6, zIndex: 5, withinPortal: false })]
  )
