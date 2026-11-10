import type { Html, HtmlBuilder } from "foldkit/html"
import { LinkSimpleIcon } from "@sth-ui/icons/icons/LinkSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { editor, initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: "left" })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Toolbar(h, {
    ariaLabel: "Text formatting",
    children: (toolbar) => [
      ...editor(model, h)(toolbar),
      toolbar.Divider(),
      toolbar.Toggle({
        href: "https://mantine.dev",
        target: "_blank",
        ariaLabel: "Mantine website",
        children: [LinkSimpleIcon(h, { weight: "bold", size: "100%" })]
      })
    ]
  })
