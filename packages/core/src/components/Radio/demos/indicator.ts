import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.RadioIndicator(h, {}),
      ui.RadioIndicator(h, { checked: true }),
      ui.RadioIndicator(h, { disabled: true }),
      ui.RadioIndicator(h, { disabled: true, checked: true }),
      ui.RadioIndicator(h, { checked: true, variant: "outline", color: "grape", size: "lg", radius: "sm" }),
      ui.RadioIndicator(h, { checked: true, variant: "light", iconColor: "teal.8" }),
      ui.RadioIndicator(h, { checked: true, color: "lime.4", autoContrast: true })
    ]
  })
