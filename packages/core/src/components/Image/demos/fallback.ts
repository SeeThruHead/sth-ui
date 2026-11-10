import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 300,
    children: [
      ui.Image(h, {
        radius: "md",
        src: "images/does-not-exist.png",
        fallbackSrc: "images/placeholder.svg",
        alt: "A picture that failed to load"
      })
    ]
  })
