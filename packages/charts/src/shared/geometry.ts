import { Array as Arr, Option } from "effect"

export type Point = { readonly x: number; readonly y: number }

export type CurveType = "linear" | "natural" | "monotone" | "step" | "stepBefore" | "stepAfter" | "bump"

const digitCount = (value: number): number => Math.floor(Math.log10(Math.abs(value))) + 1

export const formatStep = (roughStep: number, correction: number): number => {
  const digits = digitCount(roughStep)
  const scale = digits === 1 ? 0.1 : 0.05
  const ratio = roughStep / 10 ** digits

  return Number(((Math.ceil(ratio / scale) + correction) * scale * 10 ** digits).toPrecision(12))
}

const niceStep = (
  min: number,
  max: number,
  ticks: number,
  correction: number
): { readonly low: number; readonly high: number; readonly step: number } => {
  const step = formatStep((max - min) / (ticks - 1), correction)
  const below = Math.ceil(-min / step)
  const above = Math.ceil(max / step)
  const count = below + above + 1
  if (count > ticks) return niceStep(min, max, ticks, correction + 1)
  const spare = ticks - count

  return max > 0
    ? { low: -below * step, high: (above + spare) * step, step }
    : { low: -(below + spare) * step, high: 0, step }
}

const niceScale = (values: ReadonlyArray<number>) => {
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  if (min === max) return { low: min, high: max + 1, step: 0.25 }

  return niceStep(min, max, 5, 0)
}

export const niceDomain = (values: ReadonlyArray<number>): readonly [number, number] => {
  const { low, high } = niceScale(values)

  return [low, high]
}

export const niceTicks = (values: ReadonlyArray<number>): ReadonlyArray<number> => {
  const { low, step } = niceScale(values)

  return Arr.makeBy(5, (index) => Number((low + index * step).toPrecision(12)))
}

const at = (points: ReadonlyArray<Point>, index: number): Point => Option.getOrThrow(Arr.get(points, index))

const move = (point: Point) => `M${point.x},${point.y}`

const linear = (points: ReadonlyArray<Point>): string =>
  [move(at(points, 0)), ...points.slice(1).map((point) => `L${point.x},${point.y}`)].join("")

const stepped = (points: ReadonlyArray<Point>, t: number): string =>
  [
    move(at(points, 0)),
    ...points.slice(1).map((point, index) => {
      const previous = at(points, index)
      const x = previous.x * (1 - t) + point.x * t

      return `L${x},${previous.y}L${x},${point.y}L${point.x},${point.y}`
    })
  ].join("")

const bump = (points: ReadonlyArray<Point>): string =>
  [
    move(at(points, 0)),
    ...points.slice(1).map((point, index) => {
      const previous = at(points, index)
      const middle = (previous.x + point.x) / 2

      return `C${middle},${previous.y},${middle},${point.y},${point.x},${point.y}`
    })
  ].join("")

const sign = (value: number): number => (value < 0 ? -1 : 1)

const interiorSlope = (before: Point, point: Point, after: Point): number => {
  const h0 = point.x - before.x
  const h1 = after.x - point.x
  const s0 = (point.y - before.y) / h0
  const s1 = (after.y - point.y) / h1
  const p = (s0 * h1 + s1 * h0) / (h0 + h1)

  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
}

const endSlope = (from: Point, to: Point, tangent: number): number =>
  ((3 * (to.y - from.y)) / (to.x - from.x) - tangent) / 2

const tangents = (points: ReadonlyArray<Point>): ReadonlyArray<number> => {
  const inner = points
    .slice(1, -1)
    .map((point, index) => interiorSlope(at(points, index), point, at(points, index + 2)))
  const last = points.length - 1

  return [
    endSlope(at(points, 0), at(points, 1), Option.getOrThrow(Arr.head(inner))),
    ...inner,
    endSlope(at(points, last - 1), at(points, last), Option.getOrThrow(Arr.last(inner)))
  ]
}

const monotone = (points: ReadonlyArray<Point>): string => {
  const slopes = tangents(points)

  return [
    move(at(points, 0)),
    ...points.slice(1).map((point, index) => {
      const previous = at(points, index)
      const dx = (point.x - previous.x) / 3
      const t0 = Option.getOrThrow(Arr.get(slopes, index))
      const t1 = Option.getOrThrow(Arr.get(slopes, index + 1))

      return `C${previous.x + dx},${previous.y + dx * t0},${point.x - dx},${point.y - dx * t1},${point.x},${point.y}`
    })
  ].join("")
}

type Row = { readonly a: number; readonly b: number; readonly r: number }

const value = (values: ReadonlyArray<number>, index: number): number => Option.getOrThrow(Arr.get(values, index))

const rowAt = (values: ReadonlyArray<number>, index: number, last: number): Row => {
  if (index === 0) return { a: 0, b: 2, r: value(values, 0) + 2 * value(values, 1) }
  if (index === last - 1) return { a: 2, b: 7, r: 8 * value(values, last - 1) + value(values, last) }

  return { a: 1, b: 4, r: 4 * value(values, index) + 2 * value(values, index + 1) }
}

const controlPoints = (values: ReadonlyArray<number>): readonly [ReadonlyArray<number>, ReadonlyArray<number>] => {
  const last = values.length - 1
  const rows = Arr.makeBy(last, (index) => rowAt(values, index, last))
  const forward = rows.slice(1).reduce<ReadonlyArray<Row>>(
    (done, row) => {
      const previous = Option.getOrThrow(Arr.last(done))
      const m = row.a / previous.b

      return [...done, { a: row.a, b: row.b - m, r: row.r - m * previous.r }]
    },
    [Option.getOrThrow(Arr.head(rows))]
  )
  const tail = Option.getOrThrow(Arr.last(forward))
  const first = forward
    .slice(0, -1)
    .reduceRight<ReadonlyArray<number>>(
      (after, row) => [(row.r - Option.getOrThrow(Arr.head(after))) / row.b, ...after],
      [tail.r / tail.b]
    )
  const second = first.map((point, index) =>
    index === last - 1 ? (value(values, last) + point) / 2 : 2 * value(values, index + 1) - value(first, index + 1)
  )

  return [first, second]
}

const natural = (points: ReadonlyArray<Point>): string => {
  const [x1, x2] = controlPoints(points.map((point) => point.x))
  const [y1, y2] = controlPoints(points.map((point) => point.y))

  return [
    move(at(points, 0)),
    ...points
      .slice(1)
      .map(
        (point, index) =>
          `C${value(x1, index)},${value(y1, index)},${value(x2, index)},${value(y2, index)},${point.x},${point.y}`
      )
  ].join("")
}

const curves: Readonly<Record<CurveType, (points: ReadonlyArray<Point>) => string>> = {
  linear,
  natural,
  monotone,
  step: (points) => stepped(points, 0.5),
  stepBefore: (points) => stepped(points, 0),
  stepAfter: (points) => stepped(points, 1),
  bump
}

export const linePath = (points: ReadonlyArray<Point>, curve: CurveType): string => {
  if (points.length === 0) return ""
  if (points.length === 1) return `${move(at(points, 0))}Z`
  if (points.length === 2) return linear(points)

  return curves[curve](points)
}

export const areaPath = (points: ReadonlyArray<Point>, curve: CurveType, base: number): string => {
  if (points.length === 0) return ""
  const first = at(points, 0)
  const last = at(points, points.length - 1)

  return `${linePath(points, curve)}L${last.x},${base}L${first.x},${base}Z`
}

export const segments = (
  data: ReadonlyArray<number | null>,
  connectNulls: boolean
): ReadonlyArray<ReadonlyArray<{ readonly index: number; readonly value: number }>> => {
  const present = data.flatMap((entry, index) => (entry === null ? [] : [{ index, value: entry }]))
  if (connectNulls) return present.length === 0 ? [] : [present]

  return present.reduce<ReadonlyArray<ReadonlyArray<{ readonly index: number; readonly value: number }>>>(
    (runs, entry) => {
      const run = Arr.last(runs)
      const continues = Option.exists(run, (current) =>
        Option.exists(Arr.last(current), (previous) => previous.index === entry.index - 1)
      )
      if (!continues) return [...runs, [entry]]

      return [...runs.slice(0, -1), [...Option.getOrThrow(run), entry]]
    },
    []
  )
}

export type TrendColors = { readonly positive: string; readonly negative: string; readonly neutral?: string }

export const trendColor = (data: ReadonlyArray<number | null>, colors: TrendColors): string => {
  const first = data[0] ?? null
  const last = data.at(-1) ?? null
  const neutral = colors.neutral ?? colors.positive
  if (first === null || last === null) return neutral
  if (first < last) return colors.positive
  if (first > last) return colors.negative

  return neutral
}
