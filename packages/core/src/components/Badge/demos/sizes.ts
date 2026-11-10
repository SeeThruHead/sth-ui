import type { Html, HtmlBuilder } from "foldkit/html"
import type { BadgeSize } from "../Badge.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<BadgeSize> = ["xs", "sm", "md", "lg", "xl"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, { maw: 640, children: sizes.map((size) => ui.Badge(h, { size, children: [`Size ${size}`] })) })
