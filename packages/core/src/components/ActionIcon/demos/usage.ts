import type { Html, HtmlBuilder } from "foldkit/html"
import { SlidersHorizontalIcon } from "@sth-ui/icons/icons/SlidersHorizontalIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ActionIcon(h, { label: "Settings", children: [SlidersHorizontalIcon(h, { size: "70%" })] })
