import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const variants = [
  ["up", "left-to-right"],
  ["up", "right-to-left"],
  ["down", "left-to-right"],
  ["down", "right-to-left"]
] as const

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 2 },
    children: variants.map(([orientation, fillDirection]) =>
      ui.SemiCircleProgress(h, {
        value: 25,
        size: 160,
        thickness: 10,
        orientation,
        fillDirection,
        filledSegmentColor: "teal.6",
        label: `${orientation}, ${fillDirection}`,
        attributes: { root: { "data-testid": `${orientation}-${fillDirection}` } }
      })
    )
  })
