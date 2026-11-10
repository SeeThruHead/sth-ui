import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 560,
    children: (["filled", "light", "outline", "default", "transparent", "white"] as const).map((variant) =>
      ui.Alert(h, {
        id: `alert-${variant}`,
        variant,
        title: `${variant[0]?.toUpperCase() ?? ""}${variant.slice(1)} variant`,
        icon: InfoIcon(h),
        children: [`Alert with the ${variant} variant`]
      })
    )
  })
