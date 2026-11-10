import type { Html, HtmlBuilder } from "foldkit/html"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Avatar(h, { alt: "no image here" }),
      ui.Avatar(h, { color: "indigo", alt: "no image here, indigo" }),
      ui.Avatar(h, { color: "red", alt: "Vitaly Rtishchev", children: ["VR"] }),
      ui.Avatar(h, { color: "blue", radius: "xl", alt: "A star", children: [StarIcon(h, { size: 20 })] })
    ]
  })
