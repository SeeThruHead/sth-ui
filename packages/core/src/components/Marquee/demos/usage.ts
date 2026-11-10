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

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Marquee(h, { gap: "lg", maw: 640, children: logos(h, ui, 0, 8) })
