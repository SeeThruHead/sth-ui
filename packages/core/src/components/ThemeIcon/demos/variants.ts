import type { Html, HtmlBuilder } from "foldkit/html"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import type { ThemeIconVariant } from "../ThemeIcon.ts"
import type { Ui } from "../../../Ui.ts"

const variants: ReadonlyArray<ThemeIconVariant> = [
  "filled",
  "light",
  "outline",
  "transparent",
  "white",
  "default",
  "gradient"
]

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: variants.map((variant) =>
      ui.ThemeIcon(h, { variant, size: "lg", ...named(variant), children: [ImageIcon(h, { size: "70%" })] })
    )
  })
