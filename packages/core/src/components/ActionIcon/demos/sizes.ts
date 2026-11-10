import type { Html, HtmlBuilder } from "foldkit/html"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../../Ui.ts"

const star = <M>(h: HtmlBuilder<M>) => StarIcon(h, { size: "70%", weight: "fill" })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: (["xs", "xl", "input-md", 40, "3rem"] as const).map((size) =>
      ui.ActionIcon(h, { size, label: `Size ${size}`, children: [star(h)] })
    )
  })
