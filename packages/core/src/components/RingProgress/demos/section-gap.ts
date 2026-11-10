import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const sections = [
  { value: 40, color: "cyan" },
  { value: 25, color: "orange" },
  { value: 15, color: "grape" }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ["No gap (default)", 0],
      ["5° gap", 5],
      ["10° gap", 10]
    ].map(([label, gap]) =>
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", ta: "center", mb: "xs", children: [String(label)] }),
          ui.RingProgress(h, { sections, sectionGap: Number(gap), roundCaps: gap === 10 })
        ]
      )
    )
  })
