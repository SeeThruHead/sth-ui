import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { DotsThreeIcon } from "@sth-ui/icons/icons/DotsThreeIcon.ts"
import { cardSection } from "../Card.ts"
import type { Ui } from "../../../Ui.ts"

const custom = stylex.create({ section: { backgroundColor: "rgb(231, 245, 255)" } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Card(h, {
    withBorder: true,
    shadow: "sm",
    radius: "md",
    w: "100%",
    maw: 400,
    attributes: { root: { "aria-label": "Review pictures" } },
    children: [
      cardSection({
        withBorder: true,
        inheritPadding: true,
        py: "xs",
        children: [
          ui.Group(h, {
            justify: "space-between",
            children: [
              ui.Text(h, { fw: 500, children: ["Review pictures"] }),
              ui.ActionIcon(h, {
                variant: "subtle",
                color: "gray",
                label: "More actions",
                children: [DotsThreeIcon(h, { size: 16 })]
              })
            ]
          })
        ]
      }),
      ui.Text(h, {
        mt: "sm",
        c: "dimmed",
        size: "sm",
        children: ["200+ images uploaded since last visit, review them to select which one should be added."]
      }),
      cardSection({
        mt: "sm",
        styles: custom.section,
        children: [ui.Image(h, { src: "images/sailing.svg", alt: "Uploaded picture" })]
      }),
      cardSection({
        withBorder: true,
        inheritPadding: true,
        py: "xs",
        children: [ui.Text(h, { size: "xs", c: "dimmed", children: ["Uploaded by Ana"] })]
      })
    ]
  })
