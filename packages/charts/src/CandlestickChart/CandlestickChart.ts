import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedStyle, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { yFraction } from "../grid/grid.ts"
import type { ChartRow } from "../grid/grid.ts"
import { gridView } from "../grid/gridView.ts"
import type { GridOptions, GridPart, ReferenceLine } from "../grid/gridView.ts"
import { candleTicks, isUp, ohlcOf } from "./candles.ts"
import type { CandlestickChartDataKeys, Ohlc } from "./candles.ts"

export type { CandlestickChartDataKeys } from "./candles.ts"

export type CandlestickChartLabels = {
  readonly open?: string
  readonly high?: string
  readonly low?: string
  readonly close?: string
}

export type CandlestickChartPart = GridPart | "candle"

export type CandlestickChartOptions = Omit<GridOptions, "withDots" | "withLegend" | "cursorFill"> & {
  readonly dataKeys?: CandlestickChartDataKeys
  readonly labels?: CandlestickChartLabels
  readonly upColor?: string
  readonly downColor?: string
  readonly maxCandleWidth?: number
  readonly candleStrokeWidth?: number
}

export type CandlestickChartProps = CandlestickChartOptions &
  StylesApiProps<CandlestickChartPart> & {
    readonly data: ReadonlyArray<ChartRow>
    readonly dataKey: string
    readonly valueFormatter?: (value: number) => string
    readonly xAxisLabel?: string
    readonly yAxisLabel?: string
    readonly referenceLines?: ReadonlyArray<ReferenceLine>
  }

export type CandlestickChartConfig = ComponentConfig<CandlestickChartOptions, CandlestickChartPart>

const defaultKeys: CandlestickChartDataKeys = { open: "open", high: "high", low: "low", close: "close" }

const styles = stylex.create({
  slot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none"
  },
  candle: { position: "relative", flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  wick: { position: "absolute", left: "50%", transform: "translateX(-50%)" },
  body: { position: "absolute", left: 0, right: 0, minHeight: "1px" }
})

const percent = (fraction: number) => `${fraction * 100}%`

export const CandlestickChart =
  (config: { readonly CandlestickChart?: CandlestickChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CandlestickChartProps): Html => {
    const props = withDefaults(config.CandlestickChart, input)
    const getStyles = stylesApi<M, CandlestickChartPart>(h, props, config.CandlestickChart, "root")
    const keys = props.dataKeys ?? defaultKeys
    const labels = { open: "Open", high: "High", low: "Low", close: "Close", ...props.labels }
    const up = themeColor(props.upColor ?? "teal.6")
    const down = themeColor(props.downColor ?? "red.6")
    const stroke = props.candleStrokeWidth ?? 1
    const candles = props.data.map((row) => ohlcOf(row, keys))
    const count = props.data.length
    const priceTicks = candleTicks(candles.flatMap((ohlc) => (ohlc === undefined ? [] : [ohlc])))
    const candle = (ticks: ReadonlyArray<number>) => (ohlc: Ohlc | undefined, index: number) => {
      if (ohlc === undefined) return []
      const color = isUp(ohlc) ? up : down
      const top = yFraction(Math.max(ohlc.open, ohlc.close), ticks)
      const bottom = yFraction(Math.min(ohlc.open, ohlc.close), ticks)

      return [
        h.div(
          [...sx(h, styles.slot), h.Style({ left: percent((index + 0.1) / count), width: percent(0.8 / count) })],
          [
            h.div(
              [
                ...getStyles(
                  "candle",
                  styles.candle,
                  setDefinedStyle([
                    "maxWidth",
                    props.maxCandleWidth === undefined ? undefined : `${props.maxCandleWidth}px`
                  ])
                ),
                h.DataAttribute("candle", isUp(ohlc) ? "up" : "down")
              ],
              [
                h.div(
                  [
                    ...sx(h, styles.wick),
                    h.Style({
                      top: percent(yFraction(ohlc.high, ticks)),
                      bottom: percent(1 - yFraction(ohlc.low, ticks)),
                      width: `${stroke}px`,
                      backgroundColor: color
                    }),
                    h.DataAttribute("wick", "")
                  ],
                  []
                ),
                h.div(
                  [
                    ...sx(h, styles.body),
                    h.Style({
                      top: percent(top),
                      bottom: percent(1 - bottom),
                      backgroundColor: color,
                      boxShadow: `0 0 0 ${stroke / 2}px ${color}`
                    }),
                    h.DataAttribute("body", "")
                  ],
                  []
                )
              ]
            )
          ]
        )
      ]
    }

    return gridView(
      h,
      getStyles,
      { ...props, series: [], withLegend: false },
      {
        values: priceTicks,
        ticks: priceTicks,
        band: true,
        svg: () => [],
        overlay: (ticks) => candles.flatMap(candle(ticks)),
        tooltip: {
          showColor: false,
          items: (row) => {
            const ohlc = ohlcOf(row, keys)
            if (ohlc === undefined) return []
            const color = isUp(ohlc) ? up : down

            return [
              { name: labels.open, value: ohlc.open, color },
              { name: labels.high, value: ohlc.high, color },
              { name: labels.low, value: ohlc.low, color },
              { name: labels.close, value: ohlc.close, color }
            ]
          }
        }
      }
    )
  }
