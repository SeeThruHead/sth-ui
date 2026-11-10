import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Box(h, { hiddenFrom: "sm", mod: { phoneOnly: true, step: 2, off: false }, children: ["Phone only"] }),
      ui.Box(h, { visibleFrom: "sm", children: ["Desktop only"] }),
      ui.Box(h, { component: "nav", children: ["Navigation"] })
    ]
  )
