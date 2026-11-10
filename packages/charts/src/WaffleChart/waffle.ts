import { Array as Arr } from "effect"

export type WaffleChartCell = {
  readonly name: string
  readonly value: number
  readonly color: string
  readonly key?: string | number
}

export type FillDirection = "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top"

export const normalizeValue = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0)

export const allocateCells = (
  data: ReadonlyArray<WaffleChartCell>,
  gridCells: number,
  total: number | undefined
): ReadonlyArray<number> => {
  const values = data.map((cell) => normalizeValue(cell.value))
  const sum = values.reduce((acc, value) => acc + value, 0)
  if (sum === 0) return Array.from({ length: gridCells }, () => -1)
  const denominator = total === undefined ? sum : Math.max(total, sum)
  const filled = Math.round((sum / denominator) * gridCells)
  const raw = values.map((value) => (value / sum) * filled)
  const floored = raw.map(Math.floor)
  const remainder = filled - floored.reduce((acc, value) => acc + value, 0)
  const bonus = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .toSorted((a, b) => b.fraction - a.fraction)
    .slice(0, Math.max(0, remainder))
    .map((entry) => entry.index)
  const counts = floored.map((count, index) => count + (bonus.includes(index) ? 1 : 0))
  const cells = counts.flatMap((count, index) => Array.from({ length: count }, () => index)).slice(0, gridCells)

  return [...cells, ...Array.from({ length: gridCells - cells.length }, () => -1)]
}

export const cellPosition = (
  index: number,
  rows: number,
  columns: number,
  direction: FillDirection
): { readonly row: number; readonly column: number } => {
  if (direction === "top-to-bottom") return { column: Math.floor(index / rows), row: index % rows }
  if (direction === "bottom-to-top") return { column: Math.floor(index / rows), row: rows - 1 - (index % rows) }
  if (direction === "right-to-left")
    return { row: Math.floor(index / columns), column: columns - 1 - (index % columns) }

  return { row: Math.floor(index / columns), column: index % columns }
}

export const cellLayout = (columns: number, gap: number, size: number | undefined) => {
  if (size === undefined) return { cell: 20, gap }
  const gaps = (columns - 1) * gap
  const effectiveGap = gaps > size && columns > 1 ? size / (columns - 1) : gap

  return { cell: Math.max(0, (size - (columns - 1) * effectiveGap) / columns), gap: effectiveGap }
}

export const summary = (data: ReadonlyArray<WaffleChartCell>, total: number | undefined): string => {
  const values = data.map((cell) => normalizeValue(cell.value))
  const sum = values.reduce((acc, value) => acc + value, 0)
  const label = Arr.zip(data, values)
    .map(([cell, value]) => `${cell.name}: ${value}`)
    .join(", ")

  return label === "" ? "" : `${label} of ${total === undefined ? sum : Math.max(total, sum)}`
}
