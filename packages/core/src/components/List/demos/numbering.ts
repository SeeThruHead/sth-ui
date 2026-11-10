import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 3 },
    children: [
      ui.List(h, {
        type: "ordered",
        start: 5,
        items: [
          { children: ["This is item #5"] },
          { children: ["This is item #6"] },
          { children: ["This is item #7"] },
          { children: ["This is item #8"] }
        ]
      }),
      ui.List(h, {
        type: "ordered",
        reversed: true,
        items: [{ children: ["This is item #3"] }, { children: ["This is item #2"] }, { children: ["This is item #1"] }]
      }),
      ui.List(h, {
        type: "ordered",
        items: [
          { children: ["First item"] },
          { children: ["This item is #5"], value: 5 },
          { children: ["This item is #6 (continues from previous)"] },
          { children: ["This item is #10"], value: 10 },
          { children: ["This item is #11"] }
        ]
      })
    ]
  })
