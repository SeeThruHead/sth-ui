import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const long =
  "Foldkit keeps the whole state in one model and updates it with messages, so every screen is a function of data."

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: 280,
    children: [
      ui.Text(h, { truncate: true, children: [long] }),
      ui.Text(h, { truncate: "start", mt: "sm", children: [`Start: ${long}`] }),
      ui.Text(h, { lineClamp: 2, mt: "sm", children: [`Clamped: ${long}`] })
    ]
  })
