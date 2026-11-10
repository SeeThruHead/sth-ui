import type { Html, HtmlBuilder } from "foldkit/html"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Badge(h, { leftSection: AtIcon(h, { size: 12 }), children: ["With left section"] }),
      ui.Badge(h, { rightSection: AtIcon(h, { size: 12 }), children: ["With right section"] })
    ]
  })
