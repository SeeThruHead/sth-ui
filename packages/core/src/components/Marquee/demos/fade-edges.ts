import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const libraries = [
  ["Effect", "blue"],
  ["Foldkit", "cyan"],
  ["StyleX", "teal"],
  ["Vite", "green"],
  ["Vitest", "lime"],
  ["Storybook", "yellow"],
  ["Docusaurus", "orange"],
  ["Bun", "red"]
] as const

const logo = <M>(h: HtmlBuilder<M>, ui: Ui, [name, color]: readonly [string, string]) =>
  ui.Badge(h, { size: "xl", variant: "light", color, radius: "sm", children: [name] })

const logos = <M>(h: HtmlBuilder<M>, ui: Ui, from: number, to: number) =>
  libraries.slice(from, to).map((library) => logo(h, ui, library))

import type { MarqueeOptions } from "../Marquee.ts"

const rows: ReadonlyArray<{
  readonly label: string
  readonly options: MarqueeOptions
  readonly from: number
  readonly to: number
}> = [
  { label: "Default fade (5%)", options: {}, from: 0, to: 4 },
  { label: "Larger fade (15%)", options: { fadeEdgeSize: "15%" }, from: 4, to: 8 },
  {
    label: "Custom fade color",
    options: { fadeEdgeColor: "light-dark(#e7f5ff, rgba(34, 139, 230, 0.15))" },
    from: 0,
    to: 3
  },
  { label: "No fade", options: { fadeEdges: false }, from: 3, to: 6 }
]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 640,
    children: rows.map(({ label, options, from, to }) =>
      h.div(
        [],
        [
          ui.Text(h, { size: "sm", mb: "xs", children: [label] }),
          ui.Marquee(h, { ...options, children: logos(h, ui, from, to) })
        ]
      )
    )
  })
