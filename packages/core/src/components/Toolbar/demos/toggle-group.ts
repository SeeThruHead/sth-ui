import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { editor, initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: "left" })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Toolbar(h, { ariaLabel: "Text formatting", children: editor(model, h) })
