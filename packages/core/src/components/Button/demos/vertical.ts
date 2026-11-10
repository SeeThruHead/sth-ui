import type { Html, HtmlBuilder } from "foldkit/html"
import { groupButton } from "../ButtonGroup.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ButtonGroup(h, {
    orientation: "vertical",
    borderWidth: 2,
    maw: 160,
    children: ["Top", "Middle", "Bottom"].map((label) => groupButton({ variant: "outline", children: [label] }))
  })
