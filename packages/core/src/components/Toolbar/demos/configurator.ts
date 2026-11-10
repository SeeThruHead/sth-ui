import type { Html, HtmlBuilder } from "foldkit/html"
import { LinkSimpleIcon } from "@sth-ui/icons/icons/LinkSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { editor, initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "orientation",
      options: ["horizontal", "vertical"],
      initial: "horizontal",
      library: "horizontal"
    },
    { type: "select", prop: "variant", options: ["filled", "light"], initial: "filled", library: "filled" },
    { type: "color", prop: "color", initial: "blue" },
    { type: "boolean", prop: "autoContrast", initial: false, library: false },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "boolean", prop: "withBorder", initial: true, library: true }
  ],
  code: `ui.Toolbar(h, {
{{props}}  ariaLabel: "Text formatting",
  children: (toolbar) => [
      ...editor(model, h)(toolbar),
      toolbar.Divider(),
      toolbar.Toggle({
        href: "https://mantine.dev",
        target: "_blank",
        ariaLabel: "Mantine website",
        children: [LinkSimpleIcon(h, { weight: "bold", size: "100%" })]
      })
    ]
})`
})

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: [], alignment: "left" })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Toolbar(h, {
    ariaLabel: "Text formatting",
    children: (toolbar) => [
      ...editor(model, h)(toolbar),
      toolbar.Divider(),
      toolbar.Toggle({
        href: "https://mantine.dev",
        target: "_blank",
        ariaLabel: "Mantine website",
        children: [LinkSimpleIcon(h, { weight: "bold", size: "100%" })]
      })
    ],
    ...props
  })
