import type { Html, HtmlBuilder } from "foldkit/html"
import type { AvatarSize } from "../Avatar.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<AvatarSize> = ["xs", "sm", "md", "lg", "xl"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ...sizes.map((size) => ui.Avatar(h, { size, name: "Ana Bell", alt: `Size ${size}` })),
      ui.Avatar(h, { size: 100, name: "Ana Bell", alt: "100 pixels" }),
      ui.Avatar(h, { size: "3rem", radius: "md", name: "Ana Bell", alt: "3rem" })
    ]
  })
