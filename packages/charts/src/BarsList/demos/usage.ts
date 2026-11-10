import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  { name: "React", value: 850_000 },
  { name: "Vue", value: 410_000 },
  { name: "Angular", value: 300_000 },
  { name: "Svelte", value: 150_000 },
  { name: "Solid", value: 0 }
]

const downloads = new Intl.NumberFormat("en-US")

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.BarsList(h, {
    data,
    barsLabel: "Library",
    valueLabel: "Weekly downloads",
    valueFormatter: (value) => downloads.format(value),
    maw: 500,
    mx: "auto"
  })
