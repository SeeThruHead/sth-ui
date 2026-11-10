import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 3,
    spacing: "xl",
    children: (
      [
        "top-start",
        "top-center",
        "top-end",
        "middle-start",
        "middle-center",
        "middle-end",
        "bottom-start",
        "bottom-center",
        "bottom-end"
      ] as const
    ).map((position) =>
      ui.Indicator(h, {
        position,
        offset: { x: 4, y: 2 },
        radius: "xs",
        zIndex: 5,
        label: h.span([], [position]),
        children: [ui.Paper(h, { withBorder: true, h: 60, w: 140, children: [] })]
      })
    )
  })
