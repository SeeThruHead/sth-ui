import type { Html, HtmlBuilder } from "foldkit/html"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../../Ui.ts"

const star = <M>(h: HtmlBuilder<M>) => StarIcon(h, { size: "70%", weight: "fill" })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: (["filled", "light", "outline", "subtle", "transparent", "default", "white"] as const).map((variant) =>
      ui.ActionIcon(h, { variant, label: `Star ${variant}`, children: [star(h)] })
    )
  })
