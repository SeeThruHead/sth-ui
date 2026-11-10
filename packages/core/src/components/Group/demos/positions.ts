import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, { justify: "space-between", gap: "xs", children: buttons(h, ui, ["Left", "Right"]) }),
      ui.Group(h, {
        justify: "flex-end",
        align: "flex-start",
        mt: "md",
        gap: 4,
        children: buttons(h, ui, ["End"])
      })
    ]
  })
