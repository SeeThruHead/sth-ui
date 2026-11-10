import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data, list, resizable } from "./fruits.ts"
import type { Message, Model } from "./fruits.ts"

export { init, Message, Model, update } from "./fruits.ts"

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  resizable(
    h,
    "100%",
    ui.OverflowList(h, {
      ...list(model),
      data,
      gap: 4,
      maxVisibleItems: 5,
      renderOverflow: (items) => ui.Badge(h, { children: [`+${items.length} more`] }),
      renderItem: (item) => ui.Badge(h, { children: [item] })
    })
  )
