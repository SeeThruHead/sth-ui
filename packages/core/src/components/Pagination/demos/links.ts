import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

const controlPage = { first: 1, previous: 1, next: 2, last: 10 }

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Pagination(h, {
    total: 10,
    withEdges: true,
    getItemProps: (page) => ({ href: `#page-${page}` }),
    getControlProps: (control) => ({ href: `#page-${controlPage[control]}` }),
    ...paging(model, "page")
  })
