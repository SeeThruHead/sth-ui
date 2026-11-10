import type { Html, HtmlBuilder } from "foldkit/html"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Toggle(h, {
        active: true,
        variant: "filled",
        color: "lime.4",
        ariaLabel: "Without autoContrast",
        children: [TextBIcon(h, { weight: "bold", size: "100%" })]
      }),
      ui.Toggle(h, {
        autoContrast: true,
        active: true,
        variant: "filled",
        color: "lime.4",
        ariaLabel: "With autoContrast",
        children: [TextBIcon(h, { weight: "bold", size: "100%" })]
      })
    ]
  })
