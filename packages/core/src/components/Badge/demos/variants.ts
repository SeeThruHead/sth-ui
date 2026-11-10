import type { Html, HtmlBuilder } from "foldkit/html"
import type { BadgeVariant } from "../Badge.ts"
import type { Ui } from "../../../Ui.ts"

const variants: ReadonlyArray<BadgeVariant> = [
  "filled",
  "light",
  "outline",
  "dot",
  "transparent",
  "white",
  "default",
  "gradient"
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, { maw: 640, children: variants.map((variant) => ui.Badge(h, { variant, children: [variant] })) })
