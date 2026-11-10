import type { Html, HtmlBuilder } from "foldkit/html"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Avatar(h, { src: "images/avatar-1.svg", alt: "it's me" }),
      ui.Avatar(h, { radius: "xl", alt: "Default placeholder" }),
      ui.Avatar(h, { color: "cyan", radius: "xl", alt: "Letters", children: ["MK"] }),
      ui.Avatar(h, { color: "blue", radius: "sm", alt: "Custom icon", children: [StarIcon(h, { size: 20 })] })
    ]
  })
