import { Predicate, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

export const Phase = Schema.Literals(["measuring", "checking", "normal"])

export type Phase = typeof Phase.Type

export const Model = Schema.Struct({
  key: Schema.String,
  phase: Phase,
  visible: Schema.Int,
  subtract: Schema.Int,
  round: Schema.Int,
  width: Schema.Finite
})

export type Model = typeof Model.Type

export const init = (): Model => ({ key: "", phase: "measuring", visible: 0, subtract: 0, round: 0, width: 0 })

export const Message = defineMessageUnion({
  Counted: { key: Schema.String, count: Schema.Int, width: Schema.Finite },
  Subtracted: {},
  Settled: {},
  Resized: {}
})

export type Message = typeof Message.Type

const handle = (model: Model, message: Message): Model =>
  Message.match(message, {
    Counted: ({ key, count, width }): Model => ({
      ...model,
      key,
      phase: "checking",
      visible: count,
      subtract: 0,
      width
    }),
    Subtracted: () => ({ ...model, subtract: model.subtract + 1 }),
    Settled: (): Model => ({ ...model, phase: "normal" }),
    Resized: (): Model => ({ ...model, phase: "measuring" })
  })

export const update = (model: Model, message: Message): Model => ({ ...handle(model, message), round: model.round + 1 })

export type ItemBox = { readonly top: number; readonly bottom: number; readonly width: number }

type Rows = { readonly rows: number; readonly width: number; readonly fits: boolean }

const wraps = (row: Rows, needed: number, containerWidth: number): boolean => {
  if (row.width === 0) return false

  return row.width + needed > containerWidth
}

const placed =
  (containerWidth: number, gap: number, maxRows: number) =>
  (row: Rows, width: number): Rows => {
    if (!row.fits) return row
    const needed = row.width > 0 ? width + gap : width
    if (!wraps(row, needed, containerWidth)) return { ...row, width: row.width + needed }

    return { rows: row.rows + 1, width, fits: row.rows + 1 <= maxRows }
  }

export const fitsInRows = (
  widths: ReadonlyArray<number>,
  containerWidth: number,
  gap: number,
  maxRows: number
): boolean => widths.reduce(placed(containerWidth, gap, maxRows), { rows: 1, width: 0, fits: true }).fits

export const countFromStart = (
  widths: ReadonlyArray<number>,
  containerWidth: number,
  gap: number,
  maxRows: number,
  maxVisible: number
): number => {
  const failing = Array.from({ length: widths.length }, (_, index) => index + 1).findIndex(
    (count) => !fitsInRows(widths.slice(widths.length - count), containerWidth, gap, maxRows)
  )

  return Math.min(failing === -1 ? widths.length : failing, maxVisible)
}

const rowTops = (boxes: ReadonlyArray<ItemBox>): ReadonlyArray<number> =>
  [...new Set(boxes.map((box) => Math.round(box.top)))].toSorted((a, b) => a - b)

export const countFromEnd = (
  boxes: ReadonlyArray<ItemBox>,
  containerWidth: number,
  maxRows: number,
  maxVisible: number
): number => {
  const [only, ...rest] = boxes
  if (only !== undefined && rest.length === 0) return only.width > containerWidth ? 0 : 1
  const tops = new Set(rowTops(boxes).slice(0, maxRows))

  return Math.min(boxes.filter((box) => tops.has(Math.round(box.top))).length, maxVisible)
}

export const overflowWrapsAtEnd = (boxes: ReadonlyArray<ItemBox>, overflow: ItemBox): boolean => {
  const last = rowTops(boxes).at(-1)
  if (last === undefined) return false
  const bottom = Math.max(...boxes.filter((box) => Math.round(box.top) === last).map((box) => Math.round(box.bottom)))

  return overflow.top + (overflow.bottom - overflow.top) / 2 > bottom
}

export const dataSignature = <T>(
  data: ReadonlyArray<T>,
  getItemKey: ((item: T, index: number) => string | number) | undefined
): string =>
  data
    .map((item, index) => {
      if (getItemKey !== undefined) return String(getItemKey(item, index))

      return Predicate.isObject(item) ? String(index) : String(item)
    })
    .join("\u0000")
