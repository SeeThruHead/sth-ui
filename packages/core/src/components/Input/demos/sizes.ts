import type { Html, HtmlBuilder } from "foldkit/html"
import type { InputSize } from "../Input.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<InputSize> = ["xs", "sm", "md", "lg", "xl"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: sizes.map((size) => ui.Input(h, { size, placeholder: `Size ${size}` }))
  })
