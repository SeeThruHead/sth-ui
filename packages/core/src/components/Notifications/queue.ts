export const positions = [
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-center",
  "top-left",
  "top-right"
] as const

export type NotificationPosition = (typeof positions)[number]

export type Queued = {
  readonly id: string
  readonly position?: NotificationPosition | undefined
  readonly priority?: number | undefined
  readonly sequence: number
}

const order = (a: Queued, b: Queued) => (b.priority ?? 0) - (a.priority ?? 0) || a.sequence - b.sequence

export const positionOf = (item: Queued, defaultPosition: NotificationPosition): NotificationPosition =>
  item.position ?? defaultPosition

export const distribute = <A extends Queued>(
  items: ReadonlyArray<A>,
  defaultPosition: NotificationPosition,
  limit: number
): { readonly visible: ReadonlyArray<A>; readonly queued: ReadonlyArray<A> } => {
  const ranked = positions.flatMap((position) =>
    items
      .filter((item) => positionOf(item, defaultPosition) === position)
      .toSorted(order)
      .map((item, index) => ({ item, shown: index < limit }))
  )

  return {
    visible: ranked.filter((entry) => entry.shown).map((entry) => entry.item),
    queued: ranked.filter((entry) => !entry.shown).map((entry) => entry.item)
  }
}

export const grouped = <A extends Queued>(
  items: ReadonlyArray<A>,
  defaultPosition: NotificationPosition
): Readonly<Record<NotificationPosition, ReadonlyArray<A>>> => ({
  "bottom-center": items.filter((item) => positionOf(item, defaultPosition) === "bottom-center"),
  "bottom-left": items.filter((item) => positionOf(item, defaultPosition) === "bottom-left"),
  "bottom-right": items.filter((item) => positionOf(item, defaultPosition) === "bottom-right"),
  "top-center": items.filter((item) => positionOf(item, defaultPosition) === "top-center"),
  "top-left": items.filter((item) => positionOf(item, defaultPosition) === "top-left"),
  "top-right": items.filter((item) => positionOf(item, defaultPosition) === "top-right")
})

export const stackOrder = <A extends Queued>(items: ReadonlyArray<A>): ReadonlyArray<A> =>
  items.toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.sequence - a.sequence)

export type AutoClose = number | false | undefined

export const autoCloseOf = (autoClose: AutoClose, notificationAutoClose: AutoClose): AutoClose => {
  if (typeof notificationAutoClose === "number") return notificationAutoClose
  if (notificationAutoClose === false || autoClose === false) return false

  return autoClose
}

const transforms = {
  left: "translateX(-100%)",
  right: "translateX(100%)",
  "top-center": "translateY(-100%)",
  "bottom-center": "translateY(100%)"
} as const

const noTransforms = {
  left: "translateX(0)",
  right: "translateX(0)",
  "top-center": "translateY(0)",
  "bottom-center": "translateY(0)"
} as const

const sideOf = (position: NotificationPosition): keyof typeof transforms => {
  if (position === "top-center" || position === "bottom-center") return position

  return position.endsWith("left") ? "left" : "right"
}

export const stateTransform = (position: NotificationPosition, shown: boolean): string =>
  shown ? noTransforms[sideOf(position)] : transforms[sideOf(position)]

export const fallbackHeight = 64

export const stackGap = 8

export const maxStackDepth = 4

export const expandedOffsets = (
  heights: ReadonlyArray<number | undefined>,
  position: NotificationPosition
): ReadonlyArray<number> => {
  const direction = position.startsWith("top") ? 1 : -1

  return heights.map(
    (_height, index) =>
      direction *
      heights.slice(0, index).reduce<number>((sum, height) => sum + (height ?? fallbackHeight) + stackGap, 0)
  )
}

export const collapsedTransform = (index: number, position: NotificationPosition): string => {
  const depth = Math.min(index, maxStackDepth)
  const direction = position.startsWith("top") ? 1 : -1

  return `scale(${1 - depth * 0.03}) translateY(${depth * 10 * direction}px)`
}

export const shouldDismiss = (movement: number, velocity: number, width: number): boolean =>
  Math.abs(movement) > width * 0.35 || velocity > 0.5

export const swipeOpacity = (offset: number, dismissed: boolean): number =>
  dismissed ? 0 : 1 - Math.min(Math.abs(offset) / 200, 1) * 0.6
