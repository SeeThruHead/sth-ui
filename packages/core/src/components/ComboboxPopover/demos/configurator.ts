import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"
import { popoversDemo, shown } from "./popovers.ts"
import type { Message, Model } from "./popovers.ts"

export { Message, Model } from "./popovers.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "boolean", prop: "withCheckIcon", initial: true, library: true },
    { type: "select", prop: "checkIconPosition", options: ["left", "right"], initial: "left" }
  ],
  code: `ui.ComboboxPopover(h, {
  model,
  value,
  toParentMessage,
{{props}}  data: ["React", "Angular", "Vue", "Svelte"],
  target: (bind) => ui.Button(h, { bind, variant: "default", miw: 200, children: [value ?? "Select framework"] })
})`
})

const demo = popoversDemo({ usage: { data: ["React", "Angular", "Vue", "Svelte"], value: "React" } })

export const { init, update } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  demo.popover(
    h,
    ui,
    model,
    "usage",
    (bind, value) => ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select framework")] }),
    props
  )
