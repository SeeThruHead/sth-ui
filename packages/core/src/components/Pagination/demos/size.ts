import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ sm: 1, inputSm: 1 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Pagination(h, { total: 45, size: "sm", ...paging(model, "sm") }),
          ui.Button(h, { size: "sm", children: ["sm button"] }),
          ui.TextInput(h, { size: "sm", placeholder: "sm input", id: "sm-input" })
        ]
      }),
      ui.Group(h, {
        children: [
          ui.Pagination(h, { total: 45, size: "input-sm", ...paging(model, "inputSm") }),
          ui.Button(h, { size: "sm", children: ["sm button"] }),
          ui.TextInput(h, { size: "sm", placeholder: "sm input", id: "input-sm-input" })
        ]
      })
    ]
  })
