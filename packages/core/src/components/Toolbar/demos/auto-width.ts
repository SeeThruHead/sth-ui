import type { Html, HtmlBuilder } from "foldkit/html"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import { TextItalicIcon } from "@sth-ui/icons/icons/TextItalicIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: "left" })

export const view = (_model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Toolbar(h, {
    ariaLabel: "Document",
    children: (toolbar) => [
      toolbar.Toggle({ ariaLabel: "Bold", children: [TextBIcon(h, { weight: "bold", size: "100%" })] }),
      toolbar.Toggle({ ariaLabel: "Italic", children: [TextItalicIcon(h, { weight: "bold", size: "100%" })] }),
      toolbar.Divider(),
      toolbar.Toggle({ autoWidth: true, children: ["Save"] }),
      toolbar.Toggle({ autoWidth: true, children: ["Cancel"] })
    ]
  })
