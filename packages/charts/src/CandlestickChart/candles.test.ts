import { describe, expect, it } from "@effect/vitest"
import { candleDomain, candleTicks, isUp, ohlcOf } from "./candles.ts"

const keys = { open: "o", high: "h", low: "l", close: "c" }

describe("Candlestick helpers, as Mantine's", () => {
  it("reads a row only when all four prices are finite numbers", () => {
    expect(ohlcOf({ o: 1, h: 3, l: 0, c: 2 }, keys)).toEqual({ open: 1, high: 3, low: 0, close: 2 })
    expect(ohlcOf({ o: null, h: 3, l: 0, c: 2 }, keys)).toBeUndefined()
    expect(ohlcOf({ o: 1, h: "3", l: 0, c: 2 }, keys)).toBeUndefined()
    expect(ohlcOf({ o: 1, h: 3, l: Number.NaN, c: 2 }, keys)).toBeUndefined()
    expect(ohlcOf({ o: 1, h: 3, l: 0, c: Number.POSITIVE_INFINITY }, keys)).toBeUndefined()
  })

  it("pads the low to high range by 5%, or by 1 when flat", () => {
    expect(
      candleDomain([
        { open: 200, high: 240, low: 190, close: 230 },
        { open: 230, high: 290, low: 220, close: 225 }
      ])
    ).toEqual([185, 295])
    expect(candleDomain([{ open: 5, high: 5, low: 5, close: 5 }])).toEqual([4, 6])
    expect(candleDomain([])).toEqual([])
    expect(candleTicks([])).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(candleTicks([{ open: 200, high: 290, low: 190, close: 230 }])).toEqual([185, 215, 245, 275, 295])
    expect(candleTicks([{ open: 130, high: 168, low: 124, close: 160 }])).toEqual([121.8, 136.8, 151.8, 170.2])
  })

  it("calls a candle up when it closes at or above its open", () => {
    expect(isUp({ open: 1, high: 2, low: 0, close: 1 })).toBe(true)
    expect(isUp({ open: 2, high: 2, low: 0, close: 1 })).toBe(false)
  })
})
