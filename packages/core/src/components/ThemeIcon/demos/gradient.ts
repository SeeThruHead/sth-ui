import type { Html, HtmlBuilder } from "foldkit/html"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import type { Ui } from "../../../Ui.ts"

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ThemeIcon(h, {
    variant: "gradient",
    size: "xl",
    gradient: { from: "blue", to: "cyan", deg: 90 },
    ...named("Gradient action icon"),
    children: [HeartIcon(h)]
  })
