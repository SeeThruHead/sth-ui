import { Array as Arr, Option } from "effect"

export type ControlIndex = { readonly levelIndex: number; readonly rowIndex: number; readonly cellIndex: number }

export type Direction = "up" | "down" | "left" | "right"

export type Size = ReadonlyArray<ReadonlyArray<number>>

const rows = (size: Size, level: number) => Arr.getUnsafe(size, level)

const cells = (size: Size, level: number, row: number) => Arr.getUnsafe(rows(size, level), row)

const lastRowCells = (size: Size, level: number) => {
  const levelRows = rows(size, level)

  return Arr.getUnsafe(levelRows, levelRows.length - 1)
}

const up = (size: Size, at: ControlIndex): Option.Option<ControlIndex> => {
  if (at.rowIndex > 0) return Option.some({ ...at, rowIndex: at.rowIndex - 1 })
  if (at.levelIndex === 0) return Option.none()
  const previous = at.levelIndex - 1
  const last = rows(size, previous).length - 1

  return Option.some({
    levelIndex: previous,
    rowIndex: at.cellIndex <= lastRowCells(size, previous) - 1 ? last : last - 1,
    cellIndex: at.cellIndex
  })
}

const down = (size: Size, at: ControlIndex): Option.Option<ControlIndex> => {
  const last = rows(size, at.levelIndex).length - 1
  if (at.rowIndex === last) return Option.some({ levelIndex: at.levelIndex + 1, rowIndex: 0, cellIndex: at.cellIndex })
  if (at.rowIndex === last - 1 && at.cellIndex >= lastRowCells(size, at.levelIndex)) {
    return Option.some({ levelIndex: at.levelIndex + 1, rowIndex: 0, cellIndex: at.cellIndex })
  }

  return Option.some({ ...at, rowIndex: at.rowIndex + 1 })
}

const left = (size: Size, at: ControlIndex): Option.Option<ControlIndex> => {
  if (at.cellIndex > 0) return Option.some({ ...at, cellIndex: at.cellIndex - 1 })
  if (at.rowIndex > 0)
    return Option.some({ ...at, rowIndex: at.rowIndex - 1, cellIndex: cells(size, at.levelIndex, at.rowIndex - 1) - 1 })
  if (at.levelIndex === 0) return Option.none()
  const previous = at.levelIndex - 1

  return Option.some({
    levelIndex: previous,
    rowIndex: rows(size, previous).length - 1,
    cellIndex: lastRowCells(size, previous) - 1
  })
}

const right = (size: Size, at: ControlIndex): Option.Option<ControlIndex> => {
  if (at.cellIndex < cells(size, at.levelIndex, at.rowIndex) - 1)
    return Option.some({ ...at, cellIndex: at.cellIndex + 1 })
  if (at.rowIndex < rows(size, at.levelIndex).length - 1)
    return Option.some({ ...at, rowIndex: at.rowIndex + 1, cellIndex: 0 })

  return Option.some({ levelIndex: at.levelIndex + 1, rowIndex: 0, cellIndex: 0 })
}

const moves: Readonly<Record<Direction, (size: Size, at: ControlIndex) => Option.Option<ControlIndex>>> = {
  up,
  down,
  left,
  right
}

const exists = (size: Size, at: ControlIndex) => {
  if (at.levelIndex >= size.length) return false

  return at.cellIndex < cells(size, at.levelIndex, at.rowIndex)
}

export const nextControl = (
  size: Size,
  from: ControlIndex,
  direction: Direction,
  skip: (at: ControlIndex) => boolean
): Option.Option<ControlIndex> =>
  Option.flatMap(
    Option.filter(moves[direction](size, from), (at) => exists(size, at)),
    (at) => (skip(at) ? nextControl(size, at, direction, skip) : Option.some(at))
  )

export const directionOf = (key: string): Option.Option<Direction> => {
  const directions: Readonly<Record<string, Direction>> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  }

  return Option.fromNullishOr(directions[key])
}
