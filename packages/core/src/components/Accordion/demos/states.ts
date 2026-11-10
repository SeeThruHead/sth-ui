import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, Message, single } from "./accordions.ts"
import type { Model } from "./accordions.ts"
import { data } from "./data.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo(["Apples", null, null])

const items = data.map((item) =>
  accordionItem({
    value: item.value,
    children: [
      accordionControl({ icon: item.emoji, children: [item.value] }),
      accordionPanel({ children: [item.description] })
    ]
  })
)

const italic = stylex.create({ panel: { fontStyle: "italic" } })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 380,
    w: "100%",
    children: [
      ui.Accordion(h, {
        id: "rounded",
        ...single(model, 0),
        variant: "separated",
        radius: "xl",
        chevronSize: 24,
        chevronIconSize: 20,
        disableChevronRotation: true,
        loop: false,
        order: 2,
        children: items
      }),
      ui.Accordion(h, {
        id: "unmounted",
        ...single(model, 1),
        variant: "contained",
        keepMounted: false,
        chevron: null,
        chevronSize: "1.5rem",
        order: 4,
        children: [
          ...items,
          accordionItem({
            value: "kept",
            children: [
              accordionControl({ chevron: "+", children: ["Kept mounted"] }),
              accordionPanel({ keepMounted: true, children: ["Stays in the page"] })
            ]
          })
        ]
      }),
      ui.Accordion(h, {
        id: "headings",
        ...single(model, 2),
        order: 5,
        styles: { panel: italic.panel },
        attributes: { panel: { "data-testid": "panel" } },
        children: [
          "Plain child",
          accordionItem({
            value: "six",
            children: [accordionControl({ children: ["Fifth"] }), accordionPanel({ children: ["Level five"] }), "Extra"]
          })
        ]
      }),
      ui.Accordion(h, {
        id: "sixth",
        value: null,
        onChange: (value) => Message.ChangedSingle({ index: 2, value }),
        order: 6,
        children: [accordionItem({ value: "six", children: [accordionControl({ children: ["Sixth"] })] })]
      })
    ]
  })
