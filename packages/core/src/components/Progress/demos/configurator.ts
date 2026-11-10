import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "number", prop: "value", initial: 50, min: 0, max: 100, step: 10 },
    { type: "boolean", prop: "striped", initial: false, library: false },
    { type: "boolean", prop: "animated", initial: false, library: false }
  ],
  code: `ui.Progress(h, {
{{props}}  w: "100%",
  maw: 520,
  label: "Upload"
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Progress(h, { w: "100%", maw: 520, label: "Upload", ...props })
