import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Anchor(h, { href: "https://mantine.dev/", target: "_blank", rel: "noreferrer", children: ["Anchor component"] })
