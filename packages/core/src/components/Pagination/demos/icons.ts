import { ArrowLeftIcon } from "@sth-ui/icons/icons/ArrowLeftIcon.ts"
import { ArrowLineLeftIcon } from "@sth-ui/icons/icons/ArrowLineLeftIcon.ts"
import { ArrowLineRightIcon } from "@sth-ui/icons/icons/ArrowLineRightIcon.ts"
import { ArrowRightIcon } from "@sth-ui/icons/icons/ArrowRightIcon.ts"
import { DotsSixIcon } from "@sth-ui/icons/icons/DotsSixIcon.ts"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { pagesFrom, paging } from "./pages.ts"
import type { Message, Model } from "./pages.ts"

export { Message, Model, update } from "./pages.ts"

export const init = pagesFrom({ page: 1 })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Pagination(h, {
    total: 10,
    withEdges: true,
    nextIcon: ArrowRightIcon(h, { size: 18 }),
    previousIcon: ArrowLeftIcon(h, { size: 18 }),
    firstIcon: ArrowLineLeftIcon(h, { size: 18 }),
    lastIcon: ArrowLineRightIcon(h, { size: 18 }),
    dotsIcon: DotsSixIcon(h, { size: 18 }),
    ...paging(model, "page")
  })
