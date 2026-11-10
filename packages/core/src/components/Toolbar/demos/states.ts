import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { alignItems, initWith } from "./editor.ts"
import { Message as Messages } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: null })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    children: [
      ui.Toolbar(h, {
        ariaLabel: "Plain",
        withBorder: false,
        loop: false,
        children: (toolbar) => [
          toolbar.Group({
            toggles: alignItems(h).map((item) => ({
              ariaLabel: item.ariaLabel,
              active: model.alignment === item.value,
              onClick: Messages.Aligned({ value: item.value }),
              children: item.children
            }))
          }),
          toolbar.Toggle({ ariaLabel: "Locked", active: true, disabled: true, children: ["L"] })
        ]
      }),
      ui.Toolbar(h, {
        children: (toolbar) => [toolbar.Toggle({ href: "#help", ariaLabel: "Help", children: ["?"] })]
      }),
      ui.Toolbar(h, {
        ariaLabel: "Side",
        orientation: "vertical",
        children: (toolbar) => [
          toolbar.Group({ toggles: [{ ariaLabel: "Only", disabled: model.alignment === "center", children: ["O"] }] }),
          toolbar.Divider(),
          toolbar.ToggleGroup({
            type: "single",
            ariaLabel: "Alignment",
            value: model.alignment,
            onChange: (value) => Messages.Aligned({ value }),
            items: alignItems(h)
          })
        ]
      })
    ]
  })
