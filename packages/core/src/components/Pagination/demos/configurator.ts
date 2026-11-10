import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "boolean", prop: "withControls", initial: true, library: true },
    { type: "boolean", prop: "withEdges", initial: false, library: false },
    { type: "boolean", prop: "disabled", initial: false, library: false }
  ],
  code: `ui.Pagination(h, {
{{props}}  total: 10
})`
})

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.Pagination(h, { total: 10, ...paging(model, "page"), ...props })
