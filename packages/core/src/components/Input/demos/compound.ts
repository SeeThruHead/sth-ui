import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.InputLabel(h, { required: true, children: ["Input label"] }),
      ui.InputDescription(h, { children: ["Input description"] }),
      ui.InputError(h, { children: ["Input error"] })
    ]
  })
