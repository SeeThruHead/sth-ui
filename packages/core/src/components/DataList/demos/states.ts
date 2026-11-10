import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { people } from "./data.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 480,
    children: [
      ui.DataList(h, { size: "lg", gap: "xl", labelWidth: 200, items: people.slice(0, 2) }),
      ui.DataList(h, { size: "xs", labelWidth: "4rem", items: [{ label: "Plan", value: h.strong([], ["Pro"]) }] })
    ]
  })
