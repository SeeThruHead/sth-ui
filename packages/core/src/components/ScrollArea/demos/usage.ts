import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("usage", { area: {} })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.ScrollArea(h, { ...demo.area(model, "area"), h: 250, children: content(h, ui) })
