import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import type { BreadcrumbBinding } from "../Breadcrumbs.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => {
  const link = (title: string) => (crumb: BreadcrumbBinding) => ui.Anchor(h, { ...crumb, href: "#", children: [title] })

  return ui.Breadcrumbs(h, {
    unstyled: true,
    separator: "·",
    attributes: { breadcrumb: { "data-crumb": "true" } },
    children: [link("Docs"), link("Components")]
  })
}
