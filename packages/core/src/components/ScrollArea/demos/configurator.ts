import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "type",
      options: ["hover", "auto", "always", "scroll", "never"],
      initial: "hover",
      library: "hover"
    },
    { type: "boolean", prop: "offsetScrollbars", initial: false, library: false },
    {
      type: "select",
      prop: "overscrollBehavior",
      options: ["auto", "contain", "none"],
      initial: "auto",
      library: "auto"
    },
    { type: "number", prop: "scrollbarSize", initial: 10, library: 10, min: 2, max: 20, step: 2 },
    { type: "number", prop: "scrollHideDelay", initial: 1000, library: 1000, min: 0, max: 6000, step: 500 }
  ],
  code: `ui.ScrollArea(h, {
{{props}}  h: 250,
  children: content(h, ui)
})`
})

export { Message, Model } from "./areas.ts"

const demo = areaDemo("usage", { area: {} })

export const { init, update, subscriptions } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.ScrollArea(h, { ...demo.area(model, "area"), h: 250, children: content(h, ui), ...props })
