import type { Html, HtmlBuilder } from "foldkit/html"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import type { ThemeIconSize } from "../ThemeIcon.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<ThemeIconSize> = ["xs", "sm", "md", "lg", "xl"]

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ...sizes.map((size) => ui.ThemeIcon(h, { size, ...named(size), children: [HeartIcon(h, { size: "70%" })] })),
      ui.ThemeIcon(h, { size: 60, radius: "xl", ...named("60 pixels"), children: [HeartIcon(h, { size: "70%" })] }),
      ui.ThemeIcon(h, { size: "4rem", radius: 32, ...named("4rem"), children: [HeartIcon(h, { size: "70%" })] })
    ]
  })
