import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const data = [
  { skill: "Speed", Ann: 80, Bob: 60 },
  { skill: "Power", Ann: null, Bob: 90 },
  { skill: "Range", Ann: 70, Bob: null },
  { skill: "Focus", Ann: 95, Bob: 50 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.RadarChart(h, {
    h: 240,
    data,
    dataKey: "skill",
    withPolarGrid: false,
    withPolarAngleAxis: false,
    withDots: true,
    withTooltip: true,
    series: [
      { name: "Ann", color: "grape.5" },
      { name: "Bob", color: "orange.5" }
    ]
  })
