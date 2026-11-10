import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Toggle(h, { autoWidth: true, active: false, children: ["Save"] }),
      ui.Toggle(h, { autoWidth: true, active: true, children: ["Active"] }),
      ui.Toggle(h, { autoWidth: true, active: false, disabled: true, children: ["Disabled"] })
    ]
  })
