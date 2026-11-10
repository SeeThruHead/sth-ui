import type { Html, HtmlBuilder } from "foldkit/html"
import type { ButtonSize } from "../Button.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<ButtonSize> = ["xs", "sm", "md", "lg", "xl", "compact-xs", "compact-md", "compact-xl"]

const row = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style(row)],
    sizes.map((size) => ui.Button(h, { size, children: [size] }))
  )
