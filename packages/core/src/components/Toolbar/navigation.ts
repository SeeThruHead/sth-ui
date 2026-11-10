import { Option } from "effect"

export type ToolbarOrientation = "horizontal" | "vertical"

export type Movement = {
  readonly key: string
  readonly current: number
  readonly count: number
  readonly orientation: ToolbarOrientation
  readonly loop: boolean
  readonly rtl: boolean
}

const step = (movement: Movement): number => {
  const forward = movement.orientation === "vertical" ? "ArrowDown" : movement.rtl ? "ArrowLeft" : "ArrowRight"
  const backward = movement.orientation === "vertical" ? "ArrowUp" : movement.rtl ? "ArrowRight" : "ArrowLeft"
  if (movement.key === forward) return 1
  if (movement.key === backward) return -1

  return 0
}

const moved = (movement: Movement, direction: number): Option.Option<number> => {
  const next = movement.current + direction
  if (next >= 0 && next < movement.count) return Option.some(next)
  if (!movement.loop) return Option.some(movement.current)

  return Option.some(direction > 0 ? 0 : movement.count - 1)
}

export const nextIndex = (movement: Movement): Option.Option<number> => {
  if (movement.count === 0 || movement.current < 0) return Option.none()
  if (movement.key === "Home") return Option.some(0)
  if (movement.key === "End") return Option.some(movement.count - 1)
  const direction = step(movement)

  return direction === 0 ? Option.none() : moved(movement, direction)
}

export const toggledSingle = (value: string | null, item: string): string | null => (value === item ? null : item)

export const toggledMultiple = (value: ReadonlyArray<string>, item: string): ReadonlyArray<string> =>
  value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]
