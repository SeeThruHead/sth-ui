import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { popoversDemo, shown } from "./popovers.ts"
import type { Message, Model } from "./popovers.ts"

export { Message, Model } from "./popovers.ts"

const demo = popoversDemo({ usage: { data: ["React", "Angular", "Vue", "Svelte"] } })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  demo.popover(h, ui, model, "usage", (bind, value) =>
    ui.Button(h, { bind, variant: "default", miw: 200, children: [shown(value, "Select framework")] })
  )
