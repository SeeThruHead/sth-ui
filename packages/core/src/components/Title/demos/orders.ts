import type { Html, HtmlBuilder } from "foldkit/html"
import type { TitleOrder } from "../Title.ts"
import type { Ui } from "../../../Ui.ts"

const orders: ReadonlyArray<TitleOrder> = [1, 2, 3, 4, 5, 6]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, { children: orders.map((order) => ui.Title(h, { order, children: [`This is h${order} title`] })) })
