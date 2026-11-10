import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  {
    name: "Frontend",
    color: "blue.6",
    children: [
      { name: "React", value: 400 },
      { name: "Vue", value: 200 },
      { name: "Svelte", value: 100 }
    ]
  },
  {
    name: "Backend",
    color: "teal.6",
    children: [
      { name: "Node", value: 350 },
      { name: "Go", value: 150 }
    ]
  },
  { name: "Mobile", color: "grape.6", value: 120 }
]

export const view = <M>(h: HtmlBuilder<M>): Html => charts.Treemap(h, { data })
