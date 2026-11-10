import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars } from "../../../styles/StylesApi.ts"
import { scrollAreaVars } from "../ScrollArea.ts"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("offset-size", { area: { type: "always" } })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.ScrollArea(h, {
    ...demo.area(model, "area"),
    w: 300,
    h: 200,
    scrollbarSize: 6,
    offsetScrollbars: "y",
    styles: { root: setVars([scrollAreaVars.offsetSize, "20px"]) },
    children: content(h, ui)
  })
