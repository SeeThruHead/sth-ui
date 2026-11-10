import type { Html, HtmlBuilder } from "foldkit/html"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "boolean", prop: "withShadow", initial: true, library: true }],
  code: `ui.ColorSwatch(h, {
{{props}}  color: "#009790",
  ariaLabel: "Teal"
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Group(h, {
    children: [
      ui.ColorSwatch(h, { color: "#009790", ariaLabel: "Teal", ...props }),
      ui.ColorSwatch(h, { color: "rgba(234, 22, 174, 0.5)", ariaLabel: "Translucent pink" }),
      ui.ColorSwatch(h, { color: palette.orange5, ariaLabel: "Orange" })
    ]
  })
