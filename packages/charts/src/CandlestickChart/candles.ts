import type { ChartRow } from "../grid/grid.ts"
import { Array as Arr } from "effect"
import { formatStep, niceTicks } from "../shared/geometry.ts"

export type CandlestickChartDataKeys = {
  readonly open: string
  readonly high: string
  readonly low: string
  readonly close: string
}

export type Ohlc = { readonly open: number; readonly high: number; readonly low: number; readonly close: number }

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

export const ohlcOf = (row: ChartRow, keys: CandlestickChartDataKeys): Ohlc | undefined => {
  const open = row[keys.open]
  const high = row[keys.high]
  const low = row[keys.low]
  const close = row[keys.close]
  if (!finite(open)) return undefined
  if (!finite(high)) return undefined
  if (!finite(low)) return undefined
  if (!finite(close)) return undefined

  return { open, high, low, close }
}

export const candleDomain = (candles: ReadonlyArray<Ohlc>): ReadonlyArray<number> => {
  if (candles.length === 0) return []
  const low = Math.min(...candles.map((candle) => candle.low))
  const high = Math.max(...candles.map((candle) => candle.high))
  const padding = (high - low) * 0.05 || 1

  return [low - padding, high + padding]
}

export const isUp = (candle: Ohlc): boolean => candle.close >= candle.open

export const candleTicks = (candles: ReadonlyArray<Ohlc>): ReadonlyArray<number> => {
  const [low, high] = candleDomain(candles)
  if (low === undefined || high === undefined) return niceTicks([])
  const step = formatStep((high - low) / 4, 0)
  const steps = Arr.makeBy(Math.ceil((high - low) / step), (index) => Number((low + index * step).toPrecision(12)))
  const kept = steps.filter((tick, index) => index === 0 || high - tick >= step / 2)

  return [...kept, high]
}
