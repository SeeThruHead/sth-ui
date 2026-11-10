import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.List(h, {
    listStyleType: "disc",
    items: [
      {
        children: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation"
        ]
      },
      { children: ["First order item"] },
      { children: ["First order item"] },
      {
        children: [
          "First order item with list",
          ui.List(h, {
            withPadding: true,
            listStyleType: "disc",
            items: [
              { children: ["Nested item"] },
              {
                children: [
                  "Nested item with list",
                  ui.List(h, { withPadding: true, listStyleType: "disc", items: [{ children: ["Even more nested"] }] })
                ]
              }
            ]
          })
        ]
      }
    ]
  })
