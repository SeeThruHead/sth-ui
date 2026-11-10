import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      [0, "0° (right)"],
      [90, "90° (bottom)"],
      [180, "180° (left)"],
      [270, "270° (top)"]
    ].map(([angle, label]) =>
      ui.Stack(h, {
        align: "center",
        gap: "xs",
        children: [
          ui.RingProgress(h, { sections: [{ value: 40, color: "cyan" }], startAngle: Number(angle) }),
          ui.Text(h, { size: "sm", children: [String(label)] })
        ]
      })
    )
  })
