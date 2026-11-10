import type { Html, HtmlBuilder } from "foldkit/html"
import { DotsThreeIcon } from "@sth-ui/icons/icons/DotsThreeIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo([null])

const control = (h: HtmlBuilder<Message>, ui: Ui, label: string) =>
  accordionControl({
    children: [label],
    wrap: (button) =>
      ui.Center(h, {
        children: [
          button,
          ui.ActionIcon(h, {
            size: "lg",
            variant: "subtle",
            color: "gray",
            label: "More options",
            children: [DotsThreeIcon(h, { size: 20 })]
          })
        ]
      })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Accordion(h, {
    id: "side-controls",
    ...single(model, 0),
    chevronPosition: "left",
    order: 3,
    maw: 400,
    w: "100%",
    children: [1, 2, 3].map((number) =>
      accordionItem({
        value: `item-${number}`,
        children: [control(h, ui, `Control ${number}`), accordionPanel({ children: [`Panel ${number}`] })]
      })
    )
  })
