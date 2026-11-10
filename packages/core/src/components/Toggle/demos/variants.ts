import type { Html, HtmlBuilder } from "foldkit/html"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import type { Ui } from "../../../Ui.ts"
import type { ToggleVariant } from "../Toggle.ts"

const variants: ReadonlyArray<ToggleVariant> = [
  "filled",
  "light",
  "outline",
  "subtle",
  "transparent",
  "default",
  "white"
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Group(h, {
        children: variants.map((variant) =>
          ui.Toggle(h, {
            active: true,
            variant,
            ariaLabel: variant,
            children: [TextBIcon(h, { weight: "bold", size: "100%" })]
          })
        )
      }),
      ui.Group(h, {
        children: (["xs", "sm", "md", "lg", "xl"] as const).map((size) =>
          ui.Toggle(h, {
            active: false,
            size,
            radius: "xl",
            ariaLabel: `Size ${size}`,
            children: [TextBIcon(h, { weight: "bold", size: "100%" })]
          })
        )
      }),
      ui.Group(h, {
        children: [
          ui.Toggle(h, { active: true, color: "grape", size: 48, ariaLabel: "Grape", children: ["G"] }),
          ui.Toggle(h, {
            active: true,
            disabled: true,
            size: "2.5rem",
            ariaLabel: "Active and disabled",
            children: ["D"]
          })
        ]
      })
    ]
  })
