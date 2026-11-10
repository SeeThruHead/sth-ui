import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    maw: 260,
    children: [
      ui.Anchor(h, {
        href: "#gradient",
        variant: "gradient",
        gradient: { from: "pink", to: "yellow" },
        size: "xl",
        fw: 700,
        children: ["Gradient anchor"]
      }),
      ui.Anchor(h, { href: "#small", size: "xs", c: "red", underline: "always", children: ["Small red anchor"] }),
      ui.Anchor(h, {
        href: "#clamped",
        lineClamp: 1,
        download: "notes.txt",
        children: ["A long anchor that is clamped to a single line of text"]
      }),
      ui.Anchor(h, {
        href: "#truncated",
        truncate: "start",
        inline: true,
        inherit: true,
        children: ["Truncated anchor"]
      })
    ]
  })
