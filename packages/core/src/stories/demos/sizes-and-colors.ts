import type { Html, HtmlBuilder } from "foldkit/html"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    maw: 640,
    gap: "lg",
    align: "center",
    children: [
      StarIcon(h, { size: 16, label: "Small star" }),
      StarIcon(h, { size: 32, color: "#fab005", weight: "fill", label: "Gold star" }),
      StarIcon(h, { size: "3rem", color: "#228be6", weight: "duotone", label: "Blue star" }),
      ui.Text(h, {
        c: "grape",
        children: [HeartIcon(h, { weight: "fill", label: "Inherits the text colour" }), " follows the text around it"]
      })
    ]
  })
