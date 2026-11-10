import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ off: 1, on: 1 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [
      ui.Text(h, { children: ["autoContrast: off"] }),
      ui.Pagination(h, { total: 10, color: "lime.4", ...paging(model, "off") }),
      ui.Text(h, { mt: "md", children: ["autoContrast: on"] }),
      ui.Pagination(h, { total: 10, color: "lime.4", autoContrast: true, ...paging(model, "on") })
    ]
  })
