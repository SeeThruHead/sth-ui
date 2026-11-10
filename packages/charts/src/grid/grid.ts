import { Array as Arr, Option } from "effect"
import { niceTicks } from "../shared/geometry.ts"
import type { Point } from "../shared/geometry.ts"

export type ChartRow = Readonly<Record<string, string | number | null | undefined>>

export type ChartSeries = {
  readonly name: string
  readonly color: string
  readonly label?: string
  readonly strokeDasharray?: string
}

export const xFraction = (index: number, count: number): number => (count <= 1 ? 0.5 : index / (count - 1))

export const numberAt = (row: ChartRow, key: string): number | null => {
  const value = row[key]

  return typeof value === "number" ? value : null
}

export const valueTicks = (data: ReadonlyArray<ChartRow>, series: ReadonlyArray<ChartSeries>): ReadonlyArray<number> =>
  niceTicks(data.flatMap((row) => series.flatMap((item) => numberAt(row, item.name) ?? [])))

export const yFraction = (value: number, ticks: ReadonlyArray<number>): number => {
  const low = ticks[0] ?? 0
  const high = ticks.at(-1) ?? 1

  return 1 - (value - low) / (high - low)
}

export const seriesPoints = (
  data: ReadonlyArray<ChartRow>,
  name: string,
  ticks: ReadonlyArray<number>,
  connectNulls: boolean,
  position: (index: number, count: number) => number = xFraction
): ReadonlyArray<ReadonlyArray<Point & { readonly index: number }>> => {
  const present = data.flatMap((row, index) => {
    const value = numberAt(row, name)

    return value === null ? [] : [{ index, x: position(index, data.length) * 100, y: yFraction(value, ticks) * 100 }]
  })
  if (connectNulls) return present.length === 0 ? [] : [present]

  return present.reduce<ReadonlyArray<ReadonlyArray<Point & { readonly index: number }>>>((runs, point) => {
    const run = runs.at(-1)
    const previous = run?.at(-1)
    if (run === undefined || previous === undefined || previous.index !== point.index - 1) return [...runs, [point]]

    return [...runs.slice(0, -1), [...run, point]]
  }, [])
}

export const nearestIndex = (fraction: number, count: number): number =>
  count <= 1 ? 0 : Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))))

export type Span = { readonly left: number; readonly right: number }

const overlaps = (left: Span, right: Span): boolean => left.right + 5 > right.left

type Kept = { readonly index: number; readonly span: Span }

export const keptTicks = (spans: ReadonlyArray<Span>): ReadonlyArray<number> => {
  const last = spans.length - 1

  return spans
    .reduce<ReadonlyArray<Kept>>((kept, span, index) => {
      const previous = kept.at(-1)
      if (previous === undefined) return [{ index, span }]
      if (!overlaps(previous.span, span)) return [...kept, { index, span }]
      if (index !== last) return kept
      if (previous.index === 0) return [...kept, { index, span }]

      return [...kept.slice(0, -1), { index, span }]
    }, [])
    .map((entry) => entry.index)
}

export const endShifts = (
  spans: ReadonlyArray<Span>,
  bounds: Span
): { readonly head: number; readonly tail: number } => {
  const head = spans.at(0)
  const tail = spans.at(-1)
  if (head === undefined || tail === undefined) return { head: 0, tail: 0 }

  return { head: Math.max(0, bounds.left - head.left), tail: Math.min(0, bounds.right - tail.right) }
}

export const shiftedSpans = (
  spans: ReadonlyArray<Span>,
  shifts: { readonly head: number; readonly tail: number }
): ReadonlyArray<Span> =>
  spans.map((span, index) => {
    const shift = (index === 0 ? shifts.head : 0) + (index === spans.length - 1 ? shifts.tail : 0)

    return { left: span.left + shift, right: span.right + shift }
  })

export type Band = { readonly index: number; readonly low: number; readonly high: number }

export const stackedBands = (
  data: ReadonlyArray<ChartRow>,
  series: ReadonlyArray<ChartSeries>,
  percent: boolean
): ReadonlyArray<ReadonlyArray<Band>> => {
  const rows = data.map((row) => {
    const values = series.map((item) => numberAt(row, item.name) ?? 0)
    const total = values.reduce((sum, value) => sum + value, 0)
    const scale = percent && total !== 0 ? 1 / total : 1
    const tops = values.reduce<ReadonlyArray<number>>(
      (done, value) => [...done, (done.at(-1) ?? 0) + value * scale],
      []
    )

    return tops.map((high, at) => ({ low: tops[at - 1] ?? 0, high }))
  })

  return series.map((_item, at) => rows.map((bands, index) => ({ index, ...Option.getOrThrow(Arr.get(bands, at)) })))
}

export const bandPoints = (
  bands: ReadonlyArray<Band>,
  count: number,
  ticks: ReadonlyArray<number>,
  side: "low" | "high"
) =>
  bands.map((band) => ({
    index: band.index,
    x: xFraction(band.index, count) * 100,
    y: yFraction(band[side], ticks) * 100
  }))

export const bandCenter = (index: number, count: number): number => (index + 0.5) / Math.max(count, 1)

export const bandIndex = (fraction: number, count: number): number =>
  Math.min(Math.max(count - 1, 0), Math.max(0, Math.floor(fraction * count)))
