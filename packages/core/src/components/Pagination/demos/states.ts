import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 3, edge: 1, named: 1 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Pagination(h, { total: 5, disabled: true, ...paging(model, "page") }),
      ui.Pagination(h, { total: 1, hideWithOnePage: true, ...paging(model, "page") }),
      ui.Pagination(h, { total: 0, ...paging(model, "page") }),
      ui.Pagination(h, {
        total: 3,
        withControls: false,
        withEdges: true,
        radius: "xl",
        gap: 4,
        color: "grape",
        formatLabel: ({ page, totalPages }) => `${page}/${totalPages}`,
        layout: "default",
        ...paging(model, "edge")
      }),
      ui.Pagination(h, { total: 3, withPages: false, withControls: false, ...paging(model, "edge") }),
      ui.Pagination(h, {
        total: 2,
        getItemProps: (page) => ({ label: `Go to page ${page}`, children: `#${page}` }),
        ...paging(model, "named")
      })
    ]
  })
