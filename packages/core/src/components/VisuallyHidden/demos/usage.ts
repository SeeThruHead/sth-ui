import type { Html, HtmlBuilder } from "foldkit/html"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ActionIcon(h, {
    children: [HeartIcon(h, { size: "70%" }), ui.VisuallyHidden(h, { children: ["Like post"] })]
  })
