import type { Html, HtmlBuilder } from "foldkit/html"
import { CompassIcon } from "@sth-ui/icons/icons/CompassIcon.ts"
import type { Ui } from "../../../Ui.ts"
import type { TourTooltipParts } from "../Tour.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo("custom-tour", [
  { target: "custom-1", title: "Start here", children: ["Every step has an icon above its title."] },
  { target: "custom-2", title: "Settings", children: ["Then the body, and the navigation last."] }
])

export const { init, update } = demo

const layout =
  (h: HtmlBuilder<Message>, ui: Ui) =>
  (parts: TourTooltipParts): ReadonlyArray<Html> => [
    ...(parts.closeButton === null ? [] : [parts.closeButton]),
    ui.Group(h, {
      gap: "xs",
      mb: "xs",
      children: [
        ui.ThemeIcon(h, {
          variant: "light",
          size: "md",
          attributes: { root: { "data-step-icon": String(parts.index + 1) } },
          children: [CompassIcon(h, { size: 16 })]
        }),
        ...(parts.title === null ? [] : [parts.title])
      ]
    }),
    ...(parts.body === null ? [] : [parts.body]),
    parts.navigation
  ]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Button(h, { id: "custom-1", onClick: demo.startAt(0), children: ["Start tour"] }),
      ui.Button(h, { id: "custom-2", variant: "light", children: ["Settings"] }),
      ui.Tour(h, { ...demo.tour(model), renderTooltip: layout(h, ui) })
    ]
  })
