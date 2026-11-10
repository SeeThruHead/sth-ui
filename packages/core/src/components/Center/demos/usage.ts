import type { Html, HtmlBuilder } from "foldkit/html"
import { blueLight, grayLight } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Center(h, {
    maw: 400,
    h: 100,
    bg: grayLight,
    children: [ui.Box(h, { bg: blueLight, children: ["All elements inside Center are centered"] })]
  })
