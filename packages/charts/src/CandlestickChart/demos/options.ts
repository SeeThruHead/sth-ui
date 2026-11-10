import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const prices = [
  { day: "Mon", o: 12.4, h: 13.1, l: 12.1, c: 12.9 },
  { day: "Tue", o: 12.9, h: 13.4, l: 12.2, c: 12.3 },
  { day: "Wed", o: null, h: 13, l: 12, c: 12.5 },
  { day: "Thu", o: 12.3, h: 12.8, l: 11.6, c: 12.7 },
  { day: "Fri", o: 12.7, h: 13.6, l: 12.6, c: 13.5 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.CandlestickChart(h, {
    h: 300,
    data: prices,
    dataKey: "day",
    dataKeys: { open: "o", high: "h", low: "l", close: "c" },
    labels: { open: "Opened", close: "Closed" },
    upColor: "blue.6",
    downColor: "orange.6",
    maxCandleWidth: 16,
    candleStrokeWidth: 2,
    valueFormatter: (value) => `$${value.toFixed(2)}`,
    referenceLines: [{ y: 13.2, label: "Resistance", color: "red.6" }],
    xAxisLabel: "Day",
    yAxisLabel: "Price",
    accessibilityLayer: false
  })
