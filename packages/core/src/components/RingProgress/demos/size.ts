import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.RingProgress(h, {
        sections: [
          { value: 40, color: "cyan" },
          { value: 15, color: "orange" },
          { value: 15, color: "grape" }
        ]
      }),
      ui.RingProgress(h, {
        size: 180,
        thickness: 20,
        roundCaps: true,
        sections: [
          { value: 40, color: "cyan" },
          { value: 15, color: "orange" },
          { value: 15, color: "grape" }
        ]
      }),
      ui.RingProgress(h, { size: 60, thickness: 40, sections: [{ value: 70, color: "teal" }] })
    ]
  })
