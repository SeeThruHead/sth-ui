import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 5 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [
      ui.Text(h, { children: ["Pages 5–15 (startValue=5, total=15)"] }),
      ui.Pagination(h, { total: 15, startValue: 5, ...paging(model, "page") })
    ]
  })
