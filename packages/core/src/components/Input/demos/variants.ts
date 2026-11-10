import type { Html, HtmlBuilder } from "foldkit/html"
import type { InputVariant } from "../Input.ts"
import type { Ui } from "../../../Ui.ts"

const variants: ReadonlyArray<InputVariant> = ["default", "filled", "unstyled"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: variants.map((variant) => ui.Input(h, { variant, placeholder: `Variant ${variant}` }))
  })
