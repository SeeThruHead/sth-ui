import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    {
      type: "select",
      prop: "position",
      options: [
        "top-start",
        "top-center",
        "top-end",
        "middle-start",
        "middle-center",
        "middle-end",
        "bottom-start",
        "bottom-center",
        "bottom-end"
      ],
      initial: "top-end",
      library: "top-end"
    },
    { type: "size", prop: "radius", initial: "xl", library: "xl" },
    { type: "number", prop: "size", initial: 10, library: 10, min: 6, max: 30, step: 1 },
    { type: "boolean", prop: "disabled", initial: false, library: false },
    { type: "boolean", prop: "withBorder", initial: false, library: false },
    { type: "boolean", prop: "processing", initial: false, library: false }
  ],
  code: `ui.Indicator(h, {
{{props}}  inline: true,
  children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-1.svg", alt: "Avatar 1" })]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Indicator(h, {
    inline: true,
    children: [ui.Avatar(h, { size: "lg", radius: "sm", src: "images/avatar-1.svg", alt: "Avatar 1" })],
    ...props
  })
