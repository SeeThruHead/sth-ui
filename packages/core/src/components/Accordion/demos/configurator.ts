import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"
import { data } from "./data.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "contained", "filled", "separated"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "select", prop: "chevronPosition", options: ["left", "right"], initial: "right", library: "right" },
    { type: "number", prop: "chevronIconSize", initial: 16, library: 16, min: 12, max: 25 },
    { type: "boolean", prop: "disableChevronRotation", initial: false, library: false }
  ],
  code: `ui.Accordion(h, {
{{props}}  id: "usage",
  order: 3,
  maw: 380,
  w: "100%",
  children: items
})`
})

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo(["Apples"])

const items = data.map((item) =>
  accordionItem({
    value: item.value,
    children: [
      accordionControl({ icon: item.emoji, children: [item.value] }),
      accordionPanel({ children: [item.description] })
    ]
  })
)

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Accordion(h, { id: "usage", ...single(model, 0), order: 3, maw: 380, w: "100%", children: items, ...props })
