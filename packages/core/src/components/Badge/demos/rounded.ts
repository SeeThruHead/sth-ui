import type { Html, HtmlBuilder } from "foldkit/html"
import type { BadgeSize } from "../Badge.ts"
import type { Ui } from "../../../Ui.ts"

const badges: ReadonlyArray<readonly [BadgeSize, string]> = [
  ["xs", "1"],
  ["sm", "7"],
  ["md", "9"],
  ["lg", "3"],
  ["xl", "8"]
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: badges.map(([size, digit]) => ui.Badge(h, { size, circle: true, children: [digit] }))
  })
