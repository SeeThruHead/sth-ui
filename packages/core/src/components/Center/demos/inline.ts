import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.UnstyledButton(h, {
    component: "a",
    href: "#back",
    children: [
      ui.Center(h, {
        inline: true,
        component: "span",
        children: [
          ui.Box(h, { component: "span", mr: 5, children: ["←"] }),
          ui.Box(h, { component: "span", children: ["Back to Mantine website"] })
        ]
      })
    ]
  })
