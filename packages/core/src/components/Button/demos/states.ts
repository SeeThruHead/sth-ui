import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Button(h, { disabled: true, children: ["Disabled"] }),
      ui.Button(h, { loading: true, children: ["Loading"] }),
      ui.Button(h, { loading: true, variant: "outline", loaderProps: { type: "dots" }, children: ["Dots"] })
    ]
  })
