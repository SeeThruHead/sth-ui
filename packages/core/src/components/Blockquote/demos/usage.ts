import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Blockquote(h, {
    color: "blue",
    radius: "md",
    iconSize: 38,
    cite: "– Forrest Gump",
    icon: InfoIcon(h, {}),
    mt: "xl",
    maw: 380,
    children: ["Life is like an npm install – you never know what you are going to get."]
  })
