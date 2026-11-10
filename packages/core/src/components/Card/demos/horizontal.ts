import type { Html, HtmlBuilder } from "foldkit/html"
import { cardSection } from "../Card.ts"
import type { Ui } from "../../../Ui.ts"

const stats = [
  ["1,887", "Completed tasks"],
  ["447", "Remaining"],
  ["76%", "Completion"]
] as const

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Card(h, {
    padding: "sm",
    withBorder: true,
    orientation: "horizontal",
    w: "100%",
    maw: 520,
    attributes: { root: { "aria-label": "Project progress" } },
    children: [
      cardSection({
        inheritPadding: true,
        px: "xs",
        withBorder: true,
        children: [ui.Image(h, { src: "images/forest.svg", w: 150, h: 120, radius: "sm", alt: "Project cover" })]
      }),
      cardSection({
        inheritPadding: true,
        px: "md",
        children: [
          ui.Text(h, { fz: "xs", tt: "uppercase", fw: 700, c: "dimmed", children: ["Project tasks"] }),
          ui.Group(h, {
            mt: "xs",
            gap: "xl",
            children: stats.map(([figure, label]) =>
              ui.Box(h, {
                children: [
                  ui.Text(h, { fw: 600, children: [figure] }),
                  ui.Text(h, { size: "xs", c: "dimmed", children: [label] })
                ]
              })
            )
          })
        ]
      })
    ]
  })
