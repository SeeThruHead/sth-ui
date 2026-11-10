import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "size", prop: "h", initial: "md" }],
  code: `ui.Space(h, {
{{props}}})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, {
    children: [
      ui.Text(h, { children: ["First line"] }),
      ui.Space(h, { ...props }),
      ui.Text(h, { children: ["Second line, 16px further down"] }),
      ui.Space(h, { h: 40, mih: 12 }),
      ui.Text(h, { children: ["Third line, 40px further down"] })
    ]
  })
