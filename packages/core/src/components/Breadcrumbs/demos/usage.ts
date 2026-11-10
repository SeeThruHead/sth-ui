import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import type { BreadcrumbBinding } from "../Breadcrumbs.ts"

const links = [
  { title: "Mantine", href: "#" },
  { title: "Mantine hooks", href: "#" },
  { title: "use-id", href: "#" }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => {
  const items = links.map(
    ({ title, href }) =>
      (crumb: BreadcrumbBinding) =>
        ui.Anchor(h, { ...crumb, href, children: [title] })
  )

  return h.div(
    [],
    [
      ui.Breadcrumbs(h, { children: items }),
      ui.Breadcrumbs(h, { separator: "→", separatorMargin: "md", mt: "xs", children: items })
    ]
  )
}
