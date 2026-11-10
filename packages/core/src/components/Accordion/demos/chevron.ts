import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { PlusIcon } from "@sth-ui/icons/icons/PlusIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"
import { data } from "./data.ts"

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

const styles = stylex.create({
  chevron: { transform: { default: null, ":is([data-rotate])": "rotate(45deg)" } }
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Accordion(h, {
    id: "chevron",
    ...single(model, 0),
    styles: { chevron: styles.chevron },
    chevron: PlusIcon(h, { size: 16 }),
    order: 3,
    mih: 270,
    maw: 380,
    w: "100%",
    children: items
  })
