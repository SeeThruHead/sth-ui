import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ p1: 10, p2: 10, p3: 10 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xs",
    children: [1, 2, 3].flatMap((count) => [
      ui.Text(h, { mt: count === 1 ? 0 : "md", children: [count === 1 ? "1 sibling (default)" : `${count} siblings`] }),
      ui.Pagination(h, { total: 20, siblings: count, ...paging(model, `p${count}`) })
    ])
  })
