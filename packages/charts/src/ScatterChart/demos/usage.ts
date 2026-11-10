import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const ages = [
  25, 30, 35, 40, 45, 28, 22, 50, 32, 48, 26, 38, 42, 29, 34, 44, 23, 37, 49, 27, 41, 31, 46, 24, 33, 39, 47, 36, 43, 21
]

const bmis = [
  20, 22, 18, 25, 30, 15, 12, 28, 19, 31, 24, 27, 29, 16, 23, 33, 14, 26, 34, 17, 32, 21, 35, 13, 22, 28, 30, 25, 29, 11
]

export const data = [
  { color: "blue.5", name: "Group 1", data: ages.map((age, index) => ({ age, BMI: bmis[index] ?? 0 })) }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.ScatterChart(h, { h: 350, data, dataKey: { x: "age", y: "BMI" }, xAxisLabel: "Age", yAxisLabel: "BMI" })
