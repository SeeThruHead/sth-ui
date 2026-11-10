import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const sizes = ["xs", "sm", "md", "lg", "xl", 10] as const

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    sizes.map((size) => ui.Divider(h, { my: "xs", size, attributes: { root: { "data-testid": String(size) } } }))
  )
