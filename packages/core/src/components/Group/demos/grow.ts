import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 600,
    children: [
      ui.Group(h, { grow: true, children: buttons(h, ui, ["Short", "A much longer label", "Mid"]) }),
      ui.Group(h, {
        grow: true,
        preventGrowOverflow: false,
        mt: "md",
        children: buttons(h, ui, ["Free", "Grows with its content too"])
      })
    ]
  })
