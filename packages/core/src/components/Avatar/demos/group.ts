import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AvatarGroup(h, {
    attributes: { group: { "aria-label": "Team" } },
    children: [
      { src: "images/avatar-1.svg", alt: "Ana" },
      { src: "images/avatar-2.svg", alt: "Ben" },
      { src: "images/avatar-3.svg", alt: "Cleo" },
      { alt: "Five more", children: ["+5"] }
    ]
  })
