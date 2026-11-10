import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { alignment, formatting, initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: "left" })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Toolbar(h, {
    ariaLabel: "Text formatting",
    children: (toolbar) => [
      toolbar.ToggleGroup({
        ...formatting(model, h),
        items: formatting(model, h).items.map((item) => (item.value === "italic" ? { ...item, disabled: true } : item))
      }),
      toolbar.Divider(),
      toolbar.ToggleGroup(alignment(model, h, { disabled: true }))
    ]
  })
