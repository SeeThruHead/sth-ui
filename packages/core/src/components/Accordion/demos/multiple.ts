import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, multiple } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"
import { data } from "./data.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo([], [["Apples", "Bananas"]])

const items = data.map((item) =>
  accordionItem({
    value: item.value,
    children: [
      accordionControl({ icon: item.emoji, children: [item.value] }),
      accordionPanel({ children: [item.description] })
    ]
  })
)

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Accordion(h, { id: "multiple", ...multiple(model, 0), order: 3, maw: 380, w: "100%", children: items })
