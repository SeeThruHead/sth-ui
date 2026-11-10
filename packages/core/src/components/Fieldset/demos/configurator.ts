import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"
import { personal } from "./form.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "radius", initial: "md", library: "md" }
  ],
  code: `ui.Fieldset(h, {
  legend: "Personal information",
{{props}}  children: [
    ui.TextInput(h, { id: "name", label: "Your name", placeholder: "Your name" }),
    ui.TextInput(h, { id: "email", label: "Email", placeholder: "Email", mt: "md" })
  ]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, { w: "100%", maw: 500, children: [personal(h, ui, "configurator", props)] })
