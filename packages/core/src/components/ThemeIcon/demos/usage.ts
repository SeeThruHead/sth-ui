import type { Html, HtmlBuilder } from "foldkit/html"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import type { Ui } from "../../../Ui.ts"

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ThemeIcon(h, { ...named("Photos"), children: [ImageIcon(h, { size: "70%" })] })
