import type { Html, HtmlBuilder } from "foldkit/html"
import { FingerprintIcon } from "@sth-ui/icons/icons/FingerprintIcon.ts"
import type { Ui } from "../../../Ui.ts"

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ThemeIcon(h, {
        size: "lg",
        color: "lime",
        ...named("Default"),
        children: [FingerprintIcon(h, { size: 20 })]
      }),
      ui.ThemeIcon(h, {
        size: "lg",
        color: "lime",
        autoContrast: true,
        ...named("Auto contrast"),
        children: [FingerprintIcon(h, { size: 20 })]
      })
    ]
  })
