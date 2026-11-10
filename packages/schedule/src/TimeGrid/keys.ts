import { Option } from "effect"

export type SlotPosition = { readonly column: number; readonly slot: number }

export const slotTarget = (
  key: string,
  position: SlotPosition,
  size: { readonly columns: number; readonly slots: number }
): Option.Option<SlotPosition> => {
  if (key === "ArrowUp")
    return position.slot > 0 ? Option.some({ ...position, slot: position.slot - 1 }) : Option.none()
  if (key === "ArrowDown") {
    return position.slot < size.slots - 1 ? Option.some({ ...position, slot: position.slot + 1 }) : Option.none()
  }
  if (key === "ArrowLeft") {
    return position.column > 0 ? Option.some({ ...position, column: position.column - 1 }) : Option.none()
  }
  if (key !== "ArrowRight") return Option.none()

  return position.column < size.columns - 1 ? Option.some({ ...position, column: position.column + 1 }) : Option.none()
}

export type FlowPosition = { readonly row: number; readonly item: number }

const lastOf = (sizes: ReadonlyArray<number>, row: number) =>
  sizes.slice(row, row + 1).reduce((_, size) => Math.max(0, size - 1), 0)

const flowLeft = (position: FlowPosition, sizes: ReadonlyArray<number>): Option.Option<FlowPosition> => {
  if (position.item > 0) return Option.some({ ...position, item: position.item - 1 })

  return position.row > 0
    ? Option.some({ row: position.row - 1, item: lastOf(sizes, position.row - 1) })
    : Option.none()
}

const flowRight = (position: FlowPosition, sizes: ReadonlyArray<number>): Option.Option<FlowPosition> => {
  if (position.item < lastOf(sizes, position.row)) return Option.some({ ...position, item: position.item + 1 })

  return position.row < sizes.length - 1 ? Option.some({ row: position.row + 1, item: 0 }) : Option.none()
}

const flowVertical = (
  position: FlowPosition,
  sizes: ReadonlyArray<number>,
  step: number
): Option.Option<FlowPosition> => {
  const row = position.row + step
  if (row < 0 || row >= sizes.length) return Option.none()

  return Option.some({ row, item: Math.min(position.item, lastOf(sizes, row)) })
}

export const flowTarget = (
  key: string,
  position: FlowPosition,
  sizes: ReadonlyArray<number>
): Option.Option<FlowPosition> => {
  if (key === "ArrowUp") return flowVertical(position, sizes, -1)
  if (key === "ArrowDown") return flowVertical(position, sizes, 1)
  if (key === "ArrowLeft") return flowLeft(position, sizes)

  return key === "ArrowRight" ? flowRight(position, sizes) : Option.none()
}
