import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]

export const data = hours.flatMap((y, row) => days.map((x, column) => ({ x, y, value: (row * 7 + column * 5) % 17 })))

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.MatrixChart(h, { data, withXLabels: true, withYLabels: true, xLabelsRotation: 0, xLabelsHeight: 24 })
