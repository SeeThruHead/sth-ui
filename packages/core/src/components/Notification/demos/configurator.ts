import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "boolean", prop: "loading", initial: false, library: false },
    { type: "boolean", prop: "withCloseButton", initial: true, library: true },
    { type: "boolean", prop: "withBorder", initial: false, library: false },
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "title", initial: "We notify you that", library: "" },
    {
      type: "string",
      prop: "children",
      initial: "You are now obligated to give a star to Mantine project on GitHub",
      library: ""
    }
  ],
  code: `ui.Notification(h, {
{{props}}})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    w: "100%",
    children: [ui.Notification(h, { ...props, children: [props.children] })]
  })
