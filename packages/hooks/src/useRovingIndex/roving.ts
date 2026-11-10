import { Option } from "effect"

export type RovingOptions = {
  readonly total: number
  readonly orientation?: "horizontal" | "vertical" | "both"
  readonly loop?: boolean
  readonly dir?: "ltr" | "rtl"
  readonly columns?: number
  readonly isItemDisabled?: (index: number) => boolean
}

export type RovingKey = { readonly key: string; readonly ctrlKey: boolean }

const upTo = (from: number, to: number): ReadonlyArray<number> =>
  Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index)

const downTo = (from: number, to: number): ReadonlyArray<number> => upTo(to, from).toReversed()

const enabled = (options: RovingOptions) => (index: number) => options.isItemDisabled?.(index) !== true

const enabledIn = (indices: ReadonlyArray<number>, options: RovingOptions): Option.Option<number> =>
  Option.fromNullishOr(indices.find(enabled(options)))

export const firstEnabled = (options: RovingOptions): number =>
  Option.getOrElse(enabledIn(upTo(0, options.total - 1), options), () => 0)

export const lastEnabled = (options: RovingOptions): number =>
  Option.getOrElse(enabledIn(downTo(options.total - 1, 0), options), () => 0)

const wrapped = (options: RovingOptions, after: ReadonlyArray<number>, wrap: ReadonlyArray<number>) =>
  Option.orElse(enabledIn(after, options), () => (options.loop === false ? Option.none() : enabledIn(wrap, options)))

const next = (current: number, options: RovingOptions) =>
  Option.getOrElse(wrapped(options, upTo(current + 1, options.total - 1), upTo(0, current - 1)), () => current)

const previous = (current: number, options: RovingOptions) =>
  Option.getOrElse(wrapped(options, downTo(current - 1, 0), downTo(options.total - 1, current + 1)), () => current)

const along = (orientation: RovingOptions["orientation"], axis: "horizontal" | "vertical") =>
  orientation === "both" || (orientation ?? "horizontal") === axis

const listMove = (key: RovingKey, current: number, options: RovingOptions): Option.Option<number> => {
  const rtl = options.dir === "rtl"
  if (key.key === "Home") return Option.some(firstEnabled(options))
  if (key.key === "End") return Option.some(lastEnabled(options))
  if (key.key === "ArrowRight")
    return Option.liftPredicate(rtl ? previous(current, options) : next(current, options), () =>
      along(options.orientation, "horizontal")
    )
  if (key.key === "ArrowLeft")
    return Option.liftPredicate(rtl ? next(current, options) : previous(current, options), () =>
      along(options.orientation, "horizontal")
    )
  if (key.key === "ArrowDown")
    return Option.liftPredicate(next(current, options), () => along(options.orientation, "vertical"))
  if (key.key === "ArrowUp")
    return Option.liftPredicate(previous(current, options), () => along(options.orientation, "vertical"))

  return Option.none()
}

const inRange = (index: number, options: RovingOptions) => index < options.total

const gridMove = (key: RovingKey, current: number, columns: number, options: RovingOptions): Option.Option<number> => {
  const row = Math.floor(current / columns)
  const col = current % columns
  const rows = Math.ceil(options.total / columns)
  const rowCells = (cols: ReadonlyArray<number>) =>
    enabledIn(
      cols.map((column) => row * columns + column).filter((index) => inRange(index, options)),
      options
    )
  const columnCells = (rowsToTry: ReadonlyArray<number>) =>
    enabledIn(
      rowsToTry.map((each) => each * columns + col).filter((index) => inRange(index, options)),
      options
    )
  const forward = options.dir === "rtl" ? -1 : 1
  const sideways = (step: number) => rowCells(step > 0 ? upTo(col + 1, columns - 1) : downTo(col - 1, 0))
  if (key.key === "ArrowRight") return sideways(forward)
  if (key.key === "ArrowLeft") return sideways(-forward)
  if (key.key === "ArrowDown") return columnCells(upTo(row + 1, rows - 1))
  if (key.key === "ArrowUp") return columnCells(downTo(row - 1, 0))
  if (key.key === "Home") return key.ctrlKey ? Option.some(firstEnabled(options)) : rowCells(upTo(0, columns - 1))
  if (key.key === "End") return key.ctrlKey ? Option.some(lastEnabled(options)) : rowCells(downTo(columns - 1, 0))

  return Option.none()
}

export const rovingMove = (key: RovingKey, current: number, options: RovingOptions): Option.Option<number> => {
  const columns = options.columns ?? 0
  const target = columns > 0 ? gridMove(key, current, columns, options) : listMove(key, current, options)

  return Option.filter(target, (index) => index !== current)
}

export const settledIndex = (active: number, options: RovingOptions): number => {
  if (options.total === 0) return active
  if (active >= options.total) return lastEnabled(options)

  return enabled(options)(active) ? active : firstEnabled(options)
}
