import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "label", initial: "Input label", library: "" },
    { type: "boolean", prop: "withAsterisk", initial: false, library: false },
    { type: "string", prop: "description", initial: "Input description", library: "" },
    { type: "string", prop: "error", initial: "", library: "" }
  ],
  code: `ui.TreeSelect(h, {
{{props}}  placeholder: "Pick value",
  w: "100%",
  maw: 340
})`
})

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [{ id: "usage-select" }])

export const { init, update } = demo

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html => ui.TreeSelect(h, { ...demo.select(model, 0), placeholder: "Pick value", w: "100%", maw: 340, ...props })
