import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"
import { data } from "./data.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo(["Apples", "Apples", "Apples", "Apples"])

const items = data.map((item) =>
  accordionItem({
    value: item.value,
    children: [
      accordionControl({ icon: item.emoji, children: [item.value] }),
      accordionPanel({ children: [item.description] })
    ]
  })
)

const variants = ["default", "contained", "filled", "separated"] as const

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 2 },
    w: "100%",
    children: variants.map((variant, index) =>
      ui.Stack(h, {
        gap: "xs",
        children: [
          ui.Text(h, { size: "sm", fw: 500, children: [variant] }),
          ui.Accordion(h, { id: `variant-${variant}`, ...single(model, index), variant, order: 3, children: items })
        ]
      })
    )
  })
