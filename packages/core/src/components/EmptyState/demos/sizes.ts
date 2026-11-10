import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

const sizes = ["xs", "sm", "md", "lg", "xl"] as const

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    justify: "center",
    gap: "xl",
    children: sizes.map((size) =>
      ui.EmptyState(h, {
        size,
        variant: "light",
        icon: MagnifyingGlassIcon(h, {}),
        title: `Size ${size}`,
        description: "Nothing here"
      })
    )
  })
