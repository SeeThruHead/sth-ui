import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.CheckboxIndicator(h, {}),
      ui.CheckboxIndicator(h, { checked: true }),
      ui.CheckboxIndicator(h, { indeterminate: true }),
      ui.CheckboxIndicator(h, { disabled: true }),
      ui.CheckboxIndicator(h, { disabled: true, checked: true }),
      ui.CheckboxIndicator(h, { disabled: true, indeterminate: true }),
      ui.CheckboxIndicator(h, { checked: true, variant: "outline", color: "grape", size: "lg", radius: "xl" }),
      ui.CheckboxIndicator(h, { checked: true, variant: "light", iconColor: "teal.8" }),
      ui.CheckboxIndicator(h, { checked: true, color: "lime.4", autoContrast: true })
    ]
  })
