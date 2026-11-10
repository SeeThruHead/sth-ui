import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const field = <M>(h: HtmlBuilder<M>, label: string, attributes: ReadonlyArray<Attribute<M>> = []) =>
  h.label(
    [h.Style({ display: "block", marginBottom: "8px" })],
    [`${label} `, h.input([h.AriaLabel(label), ...attributes])]
  )

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.FocusTrap(h, {
    children: [
      ui.Paper(h, {
        withBorder: true,
        p: "md",
        maw: 320,
        children: [field(h, "First name"), field(h, "Last name")]
      })
    ]
  })
