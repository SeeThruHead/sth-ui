import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Pagination(h, { total: 10, ...paging(model, "page") })
