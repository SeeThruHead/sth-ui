import { Array as Arr } from "effect"

export type MatrixChartCell = { readonly x: string; readonly y: string; readonly value: number | null }

export const cellKey = (x: string, y: string): string => `${x.length}:${x}\u0000${y}`

export const cellMap = (data: ReadonlyArray<MatrixChartCell>): ReadonlyMap<string, MatrixChartCell> =>
  new Map(data.map((cell) => [cellKey(cell.x, cell.y), cell]))

export const uniqueValues = (
  data: ReadonlyArray<MatrixChartCell>,
  axis: "x" | "y",
  labels: ReadonlyArray<string> | undefined
): ReadonlyArray<string> => labels ?? Arr.dedupe(data.map((cell) => cell[axis]))

export const matrixDomain = (
  data: ReadonlyArray<MatrixChartCell>,
  domain: readonly [number, number] | undefined
): readonly [number, number] => {
  if (domain !== undefined) return domain
  const values = data.flatMap((cell) => (cell.value !== null && Number.isFinite(cell.value) ? [cell.value] : []))
  if (values.length === 0) return [0, 0]

  return [Math.min(...values), Math.max(...values)]
}

export const legendWidth = (
  labels: readonly [string, string],
  fontSize: number,
  colors: number,
  cell: number,
  gap: number
) => {
  const char = fontSize * 0.6
  const swatches = colors + 1

  return labels[0].length * char + 6 + swatches * cell + (swatches - 1) * gap + 6 + labels[1].length * char
}
