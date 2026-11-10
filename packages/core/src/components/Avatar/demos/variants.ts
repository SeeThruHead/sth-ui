import type { Html, HtmlBuilder } from "foldkit/html"
import type { AvatarVariant } from "../Avatar.ts"
import type { Ui } from "../../../Ui.ts"

const variants: ReadonlyArray<AvatarVariant> = [
  "filled",
  "light",
  "outline",
  "transparent",
  "white",
  "default",
  "gradient"
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: variants.map((variant) =>
      ui.Avatar(h, {
        variant,
        color: "blue",
        radius: "sm",
        alt: variant,
        gradient: { from: "blue", to: "cyan", deg: 45 },
        children: ["AB"]
      })
    )
  })
