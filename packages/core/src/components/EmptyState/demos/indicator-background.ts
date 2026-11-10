import type { Html, HtmlBuilder } from "foldkit/html"
import { ShoppingCartSimpleIcon } from "@sth-ui/icons/icons/ShoppingCartSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.EmptyState(h, {
    withIndicatorBackground: true,
    icon: ShoppingCartSimpleIcon(h, {}),
    title: "Your cart is empty",
    description:
      "Your shopping cart is empty right now. Browse our catalog and add the items you like to get started with your first order.",
    actions: [ui.Button(h, { variant: "default", children: ["Browse products"] })]
  })
