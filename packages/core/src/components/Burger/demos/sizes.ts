import type { Html, HtmlBuilder } from "foldkit/html"
import type { BurgerSize } from "../Burger.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<BurgerSize> = ["xs", "sm", "md", "lg", "xl"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ...sizes.map((size) => ui.Burger(h, { size, label: `Size ${size}` })),
      ui.Burger(h, { size: 30, label: "30 pixels" }),
      ui.Burger(h, { size: "2rem", label: "2rem" })
    ]
  })
