import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

const total = 145

const limit = 10

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const page = paging(model, "page")

  return ui.Group(h, {
    justify: "flex-end",
    children: [
      ui.Text(h, {
        size: "sm",
        children: [`Showing ${limit * (page.value - 1) + 1} – ${Math.min(total, limit * page.value)} of ${total}`]
      }),
      ui.Pagination(h, { total: Math.ceil(total / limit), withPages: false, ...page })
    ]
  })
}
