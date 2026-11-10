import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.PillGroup(h, {
        size: "lg",
        children: (["xs", "sm", "md", "lg", "xl"] as const).map((size) => ui.Pill(h, { size, children: [size] }))
      }),
      ui.PillGroup(h, {
        gap: "xl",
        disabled: true,
        children: [
          ui.Pill(h, { radius: "xs", children: ["Square"] }),
          ui.Pill(h, { variant: "contrast", withRemoveButton: true, children: ["Contrast"] }),
          ui.Pill(h, { disabled: true, withRemoveButton: true, children: ["Disabled"] })
        ]
      })
    ]
  })
