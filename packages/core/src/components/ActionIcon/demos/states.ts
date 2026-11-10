import type { Html, HtmlBuilder } from "foldkit/html"
import { StarIcon } from "@sth-ui/icons/icons/StarIcon.ts"
import type { Ui } from "../../../Ui.ts"

const star = <M>(h: HtmlBuilder<M>) => StarIcon(h, { size: "70%", weight: "fill" })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ActionIcon(h, {
        loading: true,
        label: "Saving",
        loaderProps: { type: "dots" },
        children: [star(h)]
      }),
      ui.ActionIcon(h, { disabled: true, label: "Unavailable", children: [star(h)] }),
      ui.ActionIcon(h, {
        variant: "gradient",
        gradient: { from: "pink", to: "orange", deg: 90 },
        radius: "xl",
        label: "Gradient",
        children: [star(h)]
      }),
      ui.ActionIcon(h, {
        color: "yellow",
        autoContrast: true,
        radius: 0,
        label: "Contrast",
        children: [star(h)]
      }),
      ui.ActionIcon(h, { color: "#7048e8", label: "Custom colour", children: [star(h)] })
    ]
  })
