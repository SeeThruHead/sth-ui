import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "shadow", initial: "xs" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "boolean", prop: "withBorder", initial: false, library: false }
  ],
  code: `ui.Paper(h, {
{{props}}  p: "xl",
  maw: 340,
  children: [
      ui.Text(h, { children: ["Paper is the most basic ui component"] }),
      ui.Text(h, {
        children: ["Use it to create cards, dropdowns, modals and other components that require background with shadow"]
      })
    ]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Paper(h, {
    p: "xl",
    maw: 340,
    children: [
      ui.Text(h, { children: ["Paper is the most basic ui component"] }),
      ui.Text(h, {
        children: ["Use it to create cards, dropdowns, modals and other components that require background with shadow"]
      })
    ],
    ...props
  })
