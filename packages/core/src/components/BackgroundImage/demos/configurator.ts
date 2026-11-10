import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "size", prop: "radius", initial: "md" }],
  code: `ui.BackgroundImage(h, {
{{props}}  src: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-6.png",
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
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 300,
    mx: "auto",
    children: [
      ui.BackgroundImage(h, {
        src: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-6.png",
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
        ],
        ...props
      })
    ]
  })
