import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

const names = ["Ada", "Grace", "Linus", "Margaret", "Alan", "Barbara", "Dennis", "Frances", "Ken", "Radia"]

const rows = Array.from({ length: 30 }, (_, id) => ({
  id,
  name: `${names[id % names.length] ?? ""} ${Math.floor(id / 10) + 1}`
}))

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const page = paging(model, "page")

  return ui.Stack(h, {
    gap: 0,
    children: [
      ...rows
        .slice((page.value - 1) * 5, page.value * 5)
        .map((row) => ui.Text(h, { children: [`id: ${row.id}, name: ${row.name}`] })),
      ui.Pagination(h, { total: 6, mt: "sm", ...page })
    ]
  })
}
