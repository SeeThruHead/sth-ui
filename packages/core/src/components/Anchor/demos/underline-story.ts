import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: (["hover", "not-hover", "always", "never"] as const).map((underline) =>
      ui.Anchor(h, { href: `#${underline}`, underline, children: [`Underline ${underline}`] })
    )
  })
