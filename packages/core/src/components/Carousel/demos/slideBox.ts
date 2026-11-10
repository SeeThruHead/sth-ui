import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const colors = ["blue", "teal", "grape", "orange", "red", "indigo", "lime", "pink"]

export const slideBox = <M>(h: HtmlBuilder<M>, ui: Ui, index: number): Html =>
  ui.Center(h, {
    h: "100%",
    mih: 120,
    bg: `${colors[index % colors.length] ?? "blue"}.6`,
    c: "white",
    children: [ui.Text(h, { size: "xl", fw: 700, children: [`Slide ${index + 1}`] })]
  })
