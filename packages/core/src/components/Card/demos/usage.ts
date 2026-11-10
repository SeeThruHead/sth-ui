import type { Html, HtmlBuilder } from "foldkit/html"
import { cardSection } from "../Card.ts"
import type { Ui } from "../../../Ui.ts"

const fjords = <M>(h: HtmlBuilder<M>, ui: Ui) =>
  ui.Card(h, {
    shadow: "sm",
    padding: "lg",
    withBorder: true,
    w: "100%",
    maw: 340,
    attributes: { root: { "aria-label": "Norway Fjord Adventures" } },
    children: [
      cardSection({ children: [ui.Image(h, { src: "images/mountains.svg", h: 160, alt: "Norway" })] }),
      ui.Group(h, {
        justify: "space-between",
        mt: "md",
        mb: "xs",
        children: [
          ui.Text(h, { fw: 500, children: ["Norway Fjord Adventures"] }),
          ui.Badge(h, { color: "pink", children: ["On Sale"] })
        ]
      }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [
          "With Fjord Tours you can explore more of the magical fjord landscapes with tours and activities on and around the fjords of Norway"
        ]
      }),
      ui.Button(h, { color: "blue", fullWidth: true, mt: "md", children: ["Book classic tour now"] })
    ]
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => fjords(h, ui)
