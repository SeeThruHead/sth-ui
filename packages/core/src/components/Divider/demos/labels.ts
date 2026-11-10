import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Divider(h, { my: "xs", label: "Label on the left", labelPosition: "left" }),
      ui.Divider(h, { my: "xs", label: "Label in the center", labelPosition: "center" }),
      ui.Divider(h, { my: "xs", label: "Label on the right", labelPosition: "right" }),
      ui.Divider(h, {
        my: "xs",
        variant: "dashed",
        labelPosition: "center",
        label: h.span(
          [h.Style({ display: "inline-flex", alignItems: "center" })],
          [MagnifyingGlassIcon(h, { size: 12 }), ui.Box(h, { ml: 5, children: ["Search results"] })]
        )
      }),
      ui.Divider(h, {
        my: "xs",
        label: ui.Anchor(h, { href: "https://mantine.dev", target: "_blank", inherit: true, children: ["Link label"] })
      })
    ]
  )
