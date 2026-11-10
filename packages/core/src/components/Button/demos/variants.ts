import type { Html, HtmlBuilder } from "foldkit/html"
import type { ButtonVariant } from "../Button.ts"
import type { Ui } from "../../../Ui.ts"

const row = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }

const variants: ReadonlyArray<ButtonVariant> = [
  "filled",
  "light",
  "outline",
  "subtle",
  "transparent",
  "white",
  "default",
  "gradient"
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [h.Style({ ...row, padding: "12px", background: "var(--sth-color-gray-light, transparent)" })],
    variants.map((variant) => ui.Button(h, { variant, children: [variant] }))
  )
