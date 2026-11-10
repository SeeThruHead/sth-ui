import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import type { FieldsetProps } from "../Fieldset.ts"

export const personal = <M>(
  h: HtmlBuilder<M>,
  ui: Ui,
  id: string,
  props: Omit<FieldsetProps, "children" | "legend"> = {},
  submit = false
): Html =>
  ui.Fieldset(h, {
    legend: "Personal information",
    ...props,
    children: [
      ui.TextInput(h, { id: `${id}-name`, label: "Your name", placeholder: "Your name" }),
      ui.TextInput(h, { id: `${id}-email`, label: "Email", placeholder: "Email", mt: "md" }),
      ...(submit
        ? [ui.Group(h, { justify: "flex-end", mt: "md", children: [ui.Button(h, { children: ["Submit"] })] })]
        : [])
    ]
  })
