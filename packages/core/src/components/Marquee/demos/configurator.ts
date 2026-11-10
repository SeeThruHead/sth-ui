import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "boolean", prop: "reverse", initial: false, library: false },
    { type: "boolean", prop: "pauseOnHover", initial: false, library: false },
    {
      type: "select",
      prop: "orientation",
      options: ["horizontal", "vertical"],
      initial: "horizontal",
      library: "horizontal"
    },
    { type: "number", prop: "repeat", initial: 4, library: 4, min: 1, max: 10 },
    { type: "number", prop: "duration", initial: 40000, library: 100000, min: 5000, max: 100000, step: 1000 },
    { type: "size", prop: "gap", initial: "md", library: "md" },
    { type: "boolean", prop: "fadeEdges", initial: true, library: true }
  ],
  code: `ui.Marquee(h, {
{{props}}  maw: 640,
  children: logos(h, ui, 0, 8)
})`
})

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

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Marquee(h, { maw: 640, children: logos(h, ui, 0, 8), ...props })
