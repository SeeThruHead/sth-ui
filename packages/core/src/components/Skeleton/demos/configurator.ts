import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "boolean", prop: "animate", initial: true }],
  code: `ui.Skeleton(h, {
{{props}}  height: 50,
  circle: true,
  mb: "xl",
  ...named("Avatar loading")
})`
})

const named = (label: string) => ({ attributes: { root: { "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, {
    maw: 480,
    children: [
      ui.Skeleton(h, { height: 50, circle: true, mb: "xl", ...named("Avatar loading"), ...props }),
      ui.Skeleton(h, { height: 8, radius: "xl", ...named("First line") }),
      ui.Skeleton(h, { height: 8, mt: 6, radius: "xl", ...named("Second line") }),
      ui.Skeleton(h, { height: 8, mt: 6, width: "70%", radius: "xl", ...named("Short line") })
    ]
  })
