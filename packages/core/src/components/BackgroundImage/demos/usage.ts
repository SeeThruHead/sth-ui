import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 300,
    mx: "auto",
    children: [
      ui.BackgroundImage(h, {
        src: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-6.png",
        radius: "md",
        children: [
          ui.Center(h, {
            p: "md",
            children: [
              ui.Text(h, {
                c: "white",
                children: [
                  "BackgroundImage component can be used to add any content on image. It is useful for hero headers and other similar sections"
                ]
              })
            ]
          })
        ]
      })
    ]
  })
